import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns";

export type CalendarRecurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  color: string;
  hour?: number;
  endHour?: number;
  allDay?: boolean;
  recurrence?: CalendarRecurrence;
  seriesId?: string | null;
  recurrenceEndDate?: string | null;
}

export interface CalendarEventInput extends Omit<CalendarEvent, "id"> {
  id?: string;
}

const rowToEvent = (r: any): CalendarEvent => ({
  id: r.id,
  date: r.date,
  title: r.title,
  color: r.color,
  hour: r.hour ?? undefined,
  endHour: r.end_hour ?? undefined,
  allDay: r.all_day ?? false,
  recurrence: (r.recurrence ?? "none") as CalendarRecurrence,
  seriesId: r.series_id ?? null,
  recurrenceEndDate: r.recurrence_end_date ?? null,
});

const nextDate = (d: Date, rec: CalendarRecurrence): Date => {
  switch (rec) {
    case "daily": return addDays(d, 1);
    case "weekly": return addWeeks(d, 1);
    case "biweekly": return addWeeks(d, 2);
    case "monthly": return addMonths(d, 1);
    default: return d;
  }
};

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("calendar_events").select("*").order("created_at");
      if (data) setEvents(data.map(rowToEvent));
      setLoading(false);
    };
    fetch();
  }, []);

  const addEvent = useCallback(async (ev: CalendarEventInput): Promise<CalendarEvent | null> => {
    const { data } = await supabase
      .from("calendar_events")
      .insert({
        ...(ev.id ? { id: ev.id } : {}),
        date: ev.date,
        title: ev.title,
        color: ev.color,
        hour: ev.hour ?? null,
        end_hour: ev.endHour ?? null,
        all_day: ev.allDay ?? false,
        recurrence: ev.recurrence ?? "none",
        series_id: ev.seriesId ?? null,
        recurrence_end_date: ev.recurrenceEndDate ?? null,
      })
      .select()
      .single();
    if (data) {
      const newEv = rowToEvent(data);
      setEvents((prev) => [...prev, newEv]);
      return newEv;
    }
    return null;
  }, []);

  /** Vytvoří sérii opakujících se událostí. Vrací seriesId. */
  const addRecurringSeries = useCallback(async (
    base: Omit<CalendarEventInput, "seriesId" | "recurrence">,
    recurrence: Exclude<CalendarRecurrence, "none">,
    endDate: string,
  ): Promise<string | null> => {
    const seriesId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const end = parseISO(endDate);
    const rows: any[] = [];
    let cur = parseISO(base.date);
    // Cap to safety limit
    for (let i = 0; i < 500; i++) {
      if (cur > end) break;
      rows.push({
        date: format(cur, "yyyy-MM-dd"),
        title: base.title,
        color: base.color,
        hour: base.hour ?? null,
        end_hour: base.endHour ?? null,
        all_day: base.allDay ?? false,
        recurrence,
        series_id: seriesId,
        recurrence_end_date: endDate,
      });
      cur = nextDate(cur, recurrence);
    }
    if (rows.length === 0) return null;
    const { data, error } = await supabase.from("calendar_events").insert(rows).select();
    if (error) {
      console.error("[addRecurringSeries] failed", error);
      return null;
    }
    if (data) setEvents((prev) => [...prev, ...data.map(rowToEvent)]);
    return seriesId;
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<Omit<CalendarEvent, "id">>) => {
    const row: any = {};
    if (updates.date !== undefined) row.date = updates.date;
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.color !== undefined) row.color = updates.color;
    if (updates.hour !== undefined) row.hour = updates.hour;
    if (updates.endHour !== undefined) row.end_hour = updates.endHour;
    if (updates.allDay !== undefined) row.all_day = updates.allDay;
    // Optimistic
    let prev: CalendarEvent | undefined;
    setEvents((list) => {
      prev = list.find((e) => e.id === id);
      return list.map((e) => (e.id === id ? { ...e, ...updates } : e));
    });
    const { error } = await supabase.from("calendar_events").update(row).eq("id", id);
    if (error && prev) {
      console.error("[updateEvent] rollback", error);
      setEvents((list) => list.map((e) => (e.id === id ? prev! : e)));
    }
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    let removed: CalendarEvent | undefined;
    setEvents((list) => {
      removed = list.find((e) => e.id === id);
      return list.filter((e) => e.id !== id);
    });
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error && removed) {
      console.error("[removeEvent] rollback", error);
      setEvents((list) => [...list, removed!]);
    }
  }, []);

  /** Smaže celou sérii (všechny instance se stejným series_id). */
  const removeSeries = useCallback(async (seriesId: string) => {
    let removed: CalendarEvent[] = [];
    setEvents((list) => {
      removed = list.filter((e) => e.seriesId === seriesId);
      return list.filter((e) => e.seriesId !== seriesId);
    });
    const { error } = await supabase.from("calendar_events").delete().eq("series_id", seriesId);
    if (error) {
      console.error("[removeSeries] rollback", error);
      setEvents((list) => [...list, ...removed]);
    }
  }, []);

  return { events, setEvents, loading, addEvent, addRecurringSeries, updateEvent, removeEvent, removeSeries };
}
