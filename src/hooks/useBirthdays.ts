import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Birthday {
  id: string;
  month: number;
  day: number;
  name: string;
}

export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("birthdays")
        .select("id, month, day, name")
        .order("month")
        .order("day");
      if (data) setBirthdays(data as Birthday[]);
      setLoading(false);
    })();
  }, []);

  const addBirthday = useCallback(async (b: Omit<Birthday, "id">) => {
    const { data } = await supabase
      .from("birthdays")
      .insert({ month: b.month, day: b.day, name: b.name })
      .select()
      .single();
    if (data) setBirthdays((prev) => [...prev, data as Birthday].sort((a, c) => a.month - c.month || a.day - c.day));
  }, []);

  const updateBirthday = useCallback(async (id: string, updates: Partial<Omit<Birthday, "id">>) => {
    await supabase.from("birthdays").update(updates).eq("id", id);
    setBirthdays((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)).sort((a, c) => a.month - c.month || a.day - c.day)
    );
  }, []);

  const removeBirthday = useCallback(async (id: string) => {
    await supabase.from("birthdays").delete().eq("id", id);
    setBirthdays((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { birthdays, loading, addBirthday, updateBirthday, removeBirthday };
}

export function getBirthdaysForDate(birthdays: Birthday[], date: Date): Birthday[] {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return birthdays.filter((b) => b.month === m && b.day === d);
}
