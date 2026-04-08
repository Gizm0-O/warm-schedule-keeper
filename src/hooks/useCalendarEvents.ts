import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  color: string;
  hour?: number;
  endHour?: number;
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("calendar_events").select("*").order("created_at");
      if (data) setEvents(data.map((r) => ({
        id: r.id,
        date: r.date,
        title: r.title,
        color: r.color,
        hour: r.hour ?? undefined,
        endHour: r.end_hour ?? undefined,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const addEvent = useCallback(async (ev: Omit<CalendarEvent, "id">): Promise<CalendarEvent | null> => {
    const { data } = await supabase
      .from("calendar_events")
      .insert({ date: ev.date, title: ev.title, color: ev.color, hour: ev.hour ?? null, end_hour: ev.endHour ?? null })
      .select()
      .single();
    if (data) {
      const newEv = { id: data.id, date: data.date, title: data.title, color: data.color, hour: data.hour ?? undefined, endHour: data.end_hour ?? undefined };
      setEvents((prev) => [...prev, newEv]);
      return newEv;
    }
    return null;
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<Omit<CalendarEvent, "id">>) => {
    const row: any = {};
    if (updates.date !== undefined) row.date = updates.date;
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.color !== undefined) row.color = updates.color;
    if (updates.hour !== undefined) row.hour = updates.hour;
    if (updates.endHour !== undefined) row.end_hour = updates.endHour;
    await supabase.from("calendar_events").update(row).eq("id", id);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    await supabase.from("calendar_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { events, setEvents, loading, addEvent, updateEvent, removeEvent };
}
