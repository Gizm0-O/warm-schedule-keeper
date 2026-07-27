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
    let list = (data as FinanceEntry[]) ?? [];

    // Auto-template: pokud je tento měsíc >= aktuální a je úplně prázdný,
    // zkopíruj Příjmy + Předplatné (kromě „(rok)") + Fixní náklady z posledního
    // předchozího měsíce, který data má. Actual = 0 (přičte se až po odkliknutí).
    const now = currentMonth();
    if (list.length === 0 && month >= now) {
      const { data: prevRows } = await supabase
        .from("finance_entries")
        .select("month")
        .lt("month", month)
        .order("month", { ascending: false })
        .limit(1);
      const sourceMonth = prevRows?.[0]?.month as string | undefined;
      if (sourceMonth) {
        const { data: src } = await supabase
          .from("finance_entries")
          .select("*")
          .eq("month", sourceMonth)
          .in("section", ["income", "subscription", "fixed"]);
        const toInsert = ((src as FinanceEntry[]) ?? [])
          .filter(e => !(e.section === "subscription" && /\(rok\)/i.test(e.name)))
          .map(e => ({
            month,
            section: e.section,
            category: e.category,
            name: e.name,
            planned: e.planned,
            actual: 0,
            due_day: e.due_day,
            note: null,
          }));
        if (toInsert.length > 0) {
          const { data: inserted } = await supabase
            .from("finance_entries")
            .insert(toInsert)
            .select();
          if (inserted) list = inserted as FinanceEntry[];
        }
      }
    }

    // Auto-mark subscriptions as paid when their due day arrives (or month is in the past)
    const nowD = new Date();
    const curMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, "0")}`;
    const today = nowD.getDate();
    const toPay = list.filter(e => {
      if (e.section !== "subscription") return false;
      if (Number(e.actual) > 0) return false;
      if (!e.planned || Number(e.planned) <= 0) return false;
      if (e.month < curMonth) return true;
      if (e.month === curMonth) {
        const d = e.due_day ? Number(e.due_day) : NaN;
        return Number.isFinite(d) && today >= d;
      }
      return false;
    });
    if (toPay.length > 0) {
      await Promise.all(toPay.map(e =>
        supabase.from("finance_entries").update({ actual: Number(e.planned) }).eq("id", e.id)
      ));
      const paidIds = new Set(toPay.map(p => p.id));
      list = list.map(e => paidIds.has(e.id) ? { ...e, actual: Number(e.planned) } : e);
    }

    setEntries(list);
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

  const restore = useCallback(async (entry: FinanceEntry) => {
    const { data, error } = await supabase.from("finance_entries").insert({
      id: entry.id,
      month: entry.month,
      section: entry.section,
      category: entry.category,
      name: entry.name,
      planned: entry.planned,
      actual: entry.actual,
      due_day: entry.due_day,
      note: entry.note,
    }).select().single();
    if (error) { console.error("[finance] restore", error); return false; }
    if (data) setEntries(prev => {
      if (prev.some(e => e.id === (data as FinanceEntry).id)) return prev;
      return [...prev, data as FinanceEntry].sort(
        (a, b) => a.created_at.localeCompare(b.created_at)
      );
    });
    return true;
  }, []);

  return { entries, loading, add, update, remove, restore, refetch: fetch };
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
