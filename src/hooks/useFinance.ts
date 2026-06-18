import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FinanceSection = "income" | "subscription" | "fixed" | "daily" | "food";

export interface FinanceEntry {
  id: string;
  month: string;
  section: FinanceSection;
  category: string | null;
  name: string;
  planned: number;
  actual: number;
  due_day: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export function useFinance(month: string) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("finance_entries")
      .select("*")
      .eq("month", month)
      .order("created_at", { ascending: true });
    if (error) console.error("[finance] fetch", error);
    setEntries((data as FinanceEntry[]) ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (
    section: FinanceSection,
    name: string,
    planned: number,
    actual: number,
    category?: string | null,
    due_day?: string | null
  ) => {
    const { data, error } = await supabase.from("finance_entries").insert({
      month, section, name, planned, actual,
      category: category ?? null, due_day: due_day ?? null,
    }).select().single();
    if (error) { console.error("[finance] add", error); return false; }
    if (data) setEntries(prev => [...prev, data as FinanceEntry]);
    return true;
  }, [month]);

  const update = useCallback(async (id: string, patch: Partial<FinanceEntry>) => {
    const { error } = await supabase.from("finance_entries").update(patch).eq("id", id);
    if (error) { console.error("[finance] update", error); return false; }
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    return true;
  }, []);

  const remove = useCallback(async (id: string) => {
    await supabase.from("finance_entries").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  return { entries, loading, add, update, remove, refetch: fetch };
}

export const MONTH_NAMES_CS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

export function formatMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return `${MONTH_NAMES_CS[mo - 1]} ${y}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
