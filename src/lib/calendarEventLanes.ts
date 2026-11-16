import type { CalendarEvent } from "@/hooks/useCalendarEvents";

export const isMultiDayEvent = (event: CalendarEvent) =>
  !!event.endDate && event.endDate > event.date;

/** Inclusive date ranges, clipped to a visible week, with non-overlapping lanes. */
export function calendarEventLanes(events: CalendarEvent[], dates: string[]) {
  const occupied: number[] = [];
  const segments = events
    .filter(isMultiDayEvent)
    .map(event => {
      const start = dates.findIndex(date => date >= event.date && date <= (event.endDate ?? event.date));
      let end = start;
      dates.forEach((date, index) => {
        if (date >= event.date && date <= (event.endDate ?? event.date)) end = index;
      });
      return { event, start, end };
    })
    .filter(segment => segment.start >= 0)
    .sort((a, b) => a.event.date.localeCompare(b.event.date) || a.event.id.localeCompare(b.event.id))
    .map(segment => {
      let lane = occupied.findIndex(end => end < segment.start);
      if (lane < 0) lane = occupied.length;
      occupied[lane] = segment.end;
      return { ...segment, lane };
    });
  return { segments, laneCount: occupied.length };
}