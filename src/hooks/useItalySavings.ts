import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SavingsEntry {
  id: string;
  amount: number;
  note: string | null;
    bonus_percent: number;
  created_at: string;
}

const GOAL = 50000;

export function useItalySavings() {
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from("italy_savings")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const percentage = Math.min(Math.round((total / GOAL) * 100), 100);
    const bonusPercent = entries[0]?.bonus_percent || 0;

  const addDeposit = useCallback(async (amount: number, note: string, date: string) => {
    const { error } = await supabase
      .from("italy_savings")
      .insert({ amount, note: note || null, created_at: date });
    if (error) {
      console.error("[italy_savings] insert error:", error);
      return false;
    }
    await fetchEntries();
    return true;
  }, [fetchEntries]);

  const removeDeposit = useCallback(async (id: string) => {
    await supabase.from("italy_savings").delete().eq("id", id);
    await fetchEntries();
  }, [fetchEntries]);

  return { entries, total, percentage, goal: GOAL, loading, addDeposit, removeDeposit, bonusPercent };
}
