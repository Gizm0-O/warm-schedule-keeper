import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isAfter, isBefore, parseISO, startOfDay } from "date-fns";

const OWNER = "Barča";
const MAX_TOKENS = 20;
const INITIAL_BALANCE = 5;

export type TokenReason =
  | "weekly"
  | "monthly"
  | "admin"
  | "task_reward"
  | "swap_spend"
  | "swap_refund";

interface TokensRow {
  id: string;
  owner: string;
  balance: number;
  last_weekly_grant: string | null;
  last_monthly_grant: string | null;
}

const SYNC_EVENT = "tokens-sync";
const emitSync = () => window.dispatchEvent(new Event(SYNC_EVENT));

/**
 * Returns the most recent Sunday at-or-before `from` (we grant on Sundays evening).
 */
function lastSundayOnOrBefore(from: Date): Date {
  const d = startOfDay(from);
  const dow = d.getDay(); // 0 = Sunday
  return addDays(d, -dow);
}

/**
 * Returns the most recent 20th of a month on-or-before `from`.
 */
function lastMonthlyAnchorOnOrBefore(from: Date): Date {
  const d = startOfDay(from);
  if (d.getDate() >= 20) {
    return new Date(d.getFullYear(), d.getMonth(), 20);
  }
  // previous month 20th
  return new Date(d.getFullYear(), d.getMonth() - 1, 20);
}

export function useTokens() {
  const [row, setRow] = useState<TokensRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("tokens_balance")
      .select("*")
      .eq("owner", OWNER)
      .maybeSingle();
    if (data) setRow(data as TokensRow);
    setLoading(false);
  }, []);

  // Auto-grant missed weekly + monthly tokens on mount
  const reconcileGrants = useCallback(async (current: TokensRow) => {
    const today = startOfDay(new Date());
    let balance = current.balance;
    let lastWeekly = current.last_weekly_grant ? parseISO(current.last_weekly_grant) : null;
    let lastMonthly = current.last_monthly_grant ? parseISO(current.last_monthly_grant) : null;

    const transactions: { amount: number; reason: TokenReason; note: string }[] = [];

    // Weekly: every Sunday
    const lastSun = lastSundayOnOrBefore(today);
    let cursor = lastWeekly ? addDays(lastWeekly, 7) : lastSun;
    if (!lastWeekly) {
      // first ever run: just mark this week as granted without back-paying
      lastWeekly = lastSun;
    } else {
      while (!isAfter(cursor, lastSun)) {
        if (balance < MAX_TOKENS) {
          balance++;
          transactions.push({ amount: 1, reason: "weekly", note: format(cursor, "yyyy-MM-dd") });
        }
        lastWeekly = cursor;
        cursor = addDays(cursor, 7);
      }
    }

    // Monthly: every 20th
    const lastMonthAnchor = lastMonthlyAnchorOnOrBefore(today);
    if (!lastMonthly) {
      lastMonthly = lastMonthAnchor;
    } else {
      let mc = new Date(lastMonthly.getFullYear(), lastMonthly.getMonth() + 1, 20);
      while (!isAfter(mc, lastMonthAnchor)) {
        if (balance < MAX_TOKENS) {
          balance++;
          transactions.push({ amount: 1, reason: "monthly", note: format(mc, "yyyy-MM-dd") });
        }
        lastMonthly = mc;
        mc = new Date(mc.getFullYear(), mc.getMonth() + 1, 20);
      }
    }

    const needsUpdate =
      balance !== current.balance ||
      format(lastWeekly, "yyyy-MM-dd") !== current.last_weekly_grant ||
      format(lastMonthly, "yyyy-MM-dd") !== current.last_monthly_grant;

    if (!needsUpdate) return;

    await supabase
      .from("tokens_balance")
      .update({
        balance,
        last_weekly_grant: format(lastWeekly, "yyyy-MM-dd"),
        last_monthly_grant: format(lastMonthly, "yyyy-MM-dd"),
      })
      .eq("id", current.id);

    if (transactions.length > 0) {
      await supabase.from("token_transactions").insert(
        transactions.map((t) => ({ owner: OWNER, ...t }))
      );
    }

    setRow({
      ...current,
      balance,
      last_weekly_grant: format(lastWeekly, "yyyy-MM-dd"),
      last_monthly_grant: format(lastMonthly, "yyyy-MM-dd"),
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("tokens_balance")
        .select("*")
        .eq("owner", OWNER)
        .maybeSingle();
      if (!mounted) return;
      if (data) {
        const r = data as TokensRow;
        setRow(r);
        await reconcileGrants(r);
      }
      setLoading(false);
    })();

    const handler = () => refresh();
    window.addEventListener(SYNC_EVENT, handler);
    const channel = supabase
      .channel(`tokens_balance_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tokens_balance" },
        () => refresh()
      )
      .subscribe();
    return () => {
      mounted = false;
      window.removeEventListener(SYNC_EVENT, handler);
      supabase.removeChannel(channel);
    };
  }, [refresh, reconcileGrants]);

  /** Atomically change balance by `delta`. Returns true on success. */
  const change = useCallback(
    async (delta: number, reason: TokenReason, opts?: { shiftKey?: string; note?: string }) => {
      if (!row) return false;
      const next = row.balance + delta;
      if (next < 0) return false;
      const clamped = Math.min(next, MAX_TOKENS);
      const actualDelta = clamped - row.balance;
      if (actualDelta === 0 && delta > 0) {
        // hit the cap
        return false;
      }
      const { error } = await supabase
        .from("tokens_balance")
        .update({ balance: clamped })
        .eq("id", row.id);
      if (error) return false;
      await supabase.from("token_transactions").insert({
        owner: OWNER,
        amount: actualDelta,
        reason,
        shift_key: opts?.shiftKey ?? null,
        note: opts?.note ?? null,
      });
      setRow({ ...row, balance: clamped });
      emitSync();
      return true;
    },
    [row]
  );

  const spend = useCallback(
    (reason: TokenReason, opts?: { shiftKey?: string; note?: string }) =>
      change(-1, reason, opts),
    [change]
  );

  const grant = useCallback(
    (reason: TokenReason, opts?: { shiftKey?: string; note?: string }) =>
      change(1, reason, opts),
    [change]
  );

  /** Admin override: set explicit balance. */
  const setBalance = useCallback(
    async (value: number) => {
      if (!row) return;
      const clamped = Math.max(0, Math.min(MAX_TOKENS, Math.floor(value)));
      const delta = clamped - row.balance;
      await supabase.from("tokens_balance").update({ balance: clamped }).eq("id", row.id);
      if (delta !== 0) {
        await supabase
          .from("token_transactions")
          .insert({ owner: OWNER, amount: delta, reason: "admin", note: "manual set" });
      }
      setRow({ ...row, balance: clamped });
      emitSync();
    },
    [row]
  );

  return {
    balance: row?.balance ?? 0,
    max: MAX_TOKENS,
    initial: INITIAL_BALANCE,
    loading,
    spend,
    grant,
    setBalance,
    refresh,
  };
}

// kept for tree-shaking safety
void isBefore;
