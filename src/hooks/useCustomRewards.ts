import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomRewardTemplate {
  id: string;
  todo_id: string;
  label: string;
  repeat_on_recurring: boolean;
  position: number;
  is_token: boolean;
}

export interface EarnedReward {
  id: string;
  source_reward_id: string | null;
  todo_id: string | null;
  todo_text: string | null;
  label: string;
  status: 'available' | 'active' | 'completed';
  earned_at: string;
  activated_at: string | null;
  completed_at: string | null;
}

type EarnedRewardsSyncEvent =
  | { type: "upsert"; reward: EarnedReward }
  | { type: "remove"; id: string }
  | { type: "remove_for_todo"; todoId: string; sourceRewardIds?: string[] }
  | { type: "refresh" };

const EARNED_REWARDS_SYNC_EVENT = "earned-rewards-sync";

const emitEarnedRewardsSync = (detail: EarnedRewardsSyncEvent) => {
  window.dispatchEvent(new CustomEvent<EarnedRewardsSyncEvent>(EARNED_REWARDS_SYNC_EVENT, { detail }));
};

/**
 * Templates of custom rewards attached to todos (admin-defined).
 * Loads ALL templates once and groups by todo_id for fast lookup.
 */
export function useCustomRewards() {
  const [templates, setTemplates] = useState<CustomRewardTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("task_custom_rewards")
      .select("*")
      .order("position", { ascending: true });
    if (!error && data) setTemplates(data as CustomRewardTemplate[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`task_custom_rewards_changes_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_custom_rewards" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const getRewardsForTodo = useCallback(
    (todoId: string) => templates.filter((t) => t.todo_id === todoId),
    [templates]
  );

  const setRewardsForTodo = useCallback(async (todoId: string, rewards: { label: string; repeat_on_recurring: boolean; is_token?: boolean }[]) => {
    // Replace strategy: delete existing + insert new
    await supabase.from("task_custom_rewards").delete().eq("todo_id", todoId);
    if (rewards.length === 0) {
      await refresh();
      return;
    }
    const rows = rewards
      .filter(r => r.label.trim().length > 0)
      .map((r, idx) => ({
        todo_id: todoId,
        label: r.label.trim(),
        repeat_on_recurring: r.repeat_on_recurring,
        position: idx,
        is_token: !!r.is_token,
      }));
    if (rows.length > 0) {
      await supabase.from("task_custom_rewards").insert(rows);
    }
    await refresh();
  }, [refresh]);

  return { templates, loading, getRewardsForTodo, setRewardsForTodo, refresh };
}

/**
 * Earned rewards (vouchers Barča owns).
 */
export function useEarnedRewards() {
  const [rewards, setRewards] = useState<EarnedReward[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("earned_rewards")
      .select("*")
      .order("earned_at", { ascending: false });
    if (!error && data) setRewards(data as EarnedReward[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent<EarnedRewardsSyncEvent>).detail;
      if (!detail) return;
      if (detail.type === "upsert") {
        setRewards((prev) => [detail.reward, ...prev.filter((r) => r.id !== detail.reward.id)]);
      }
      if (detail.type === "remove") {
        setRewards((prev) => prev.filter((r) => r.id !== detail.id));
      }
      if (detail.type === "remove_for_todo") {
        setRewards((prev) => prev.filter((r) => {
          if (r.todo_id !== detail.todoId) return true;
          if (!detail.sourceRewardIds || detail.sourceRewardIds.length === 0) return false;
          return !r.source_reward_id || !detail.sourceRewardIds.includes(r.source_reward_id);
        }));
      }
      if (detail.type === "refresh") refresh();
    };
    window.addEventListener(EARNED_REWARDS_SYNC_EVENT, handleSync);
    const channel = supabase
      .channel(`earned_rewards_changes_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "earned_rewards" }, () => refresh())
      .subscribe();
    return () => {
      window.removeEventListener(EARNED_REWARDS_SYNC_EVENT, handleSync);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const grant = useCallback(async (input: {
    source_reward_id?: string | null;
    todo_id?: string | null;
    todo_text?: string | null;
    label: string;
  }) => {
    const { data, error } = await supabase
      .from("earned_rewards")
      .insert({
        source_reward_id: input.source_reward_id ?? null,
        todo_id: input.todo_id ?? null,
        todo_text: input.todo_text ?? null,
        label: input.label,
        status: 'available',
      })
      .select()
      .single();
    if (error) throw error;
    const reward = data as EarnedReward;
    setRewards((prev) => [reward, ...prev.filter((r) => r.id !== reward.id)]);
    emitEarnedRewardsSync({ type: "upsert", reward });
    return reward;
  }, []);

  const remove = useCallback(async (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
    emitEarnedRewardsSync({ type: "remove", id });
    await supabase.from("earned_rewards").delete().eq("id", id);
  }, []);

  const revokeForTodo = useCallback(async (todoId: string, sourceRewardIds?: string[]) => {
    setRewards((prev) => prev.filter((r) => {
      if (r.todo_id !== todoId) return true;
      if (!sourceRewardIds || sourceRewardIds.length === 0) return false;
      return !r.source_reward_id || !sourceRewardIds.includes(r.source_reward_id);
    }));
    emitEarnedRewardsSync({ type: "remove_for_todo", todoId, sourceRewardIds });

    let query = supabase.from("earned_rewards").delete().eq("todo_id", todoId);
    if (sourceRewardIds && sourceRewardIds.length > 0) {
      query = query.in("source_reward_id", sourceRewardIds);
    }
    const { error } = await query;
    if (error) {
      await refresh();
      emitEarnedRewardsSync({ type: "refresh" });
      throw error;
    }
  }, [refresh]);

  const activate = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setRewards((prev) => prev.map((r) => r.id === id ? { ...r, status: 'active', activated_at: now } : r));
    await supabase.from("earned_rewards").update({
      status: 'active',
      activated_at: now,
    }).eq("id", id);
  }, []);

  const deactivate = useCallback(async (id: string) => {
    setRewards((prev) => prev.map((r) => r.id === id ? { ...r, status: 'available', activated_at: null } : r));
    await supabase.from("earned_rewards").update({
      status: 'available',
      activated_at: null,
    }).eq("id", id);
  }, []);

  const complete = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setRewards((prev) => prev.map((r) => r.id === id ? { ...r, status: 'completed', completed_at: now } : r));
    await supabase.from("earned_rewards").update({
      status: 'completed',
      completed_at: now,
    }).eq("id", id);
  }, []);

  return { rewards, loading, grant, remove, revokeForTodo, activate, deactivate, complete, refresh };
}
