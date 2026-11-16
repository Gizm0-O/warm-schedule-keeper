import { describe, expect, it } from "vitest";
import { calendarEventLanes } from "@/lib/calendarEventLanes";

const dates = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];
const event = (id: string, date: string, endDate: string) => ({ id, date, endDate, title: id, color: "" });

describe("multi-day calendar lanes", () => {
  it("includes the final day and clips a continuing event to each week", () => {
    const events = [event("a", "2026-11-20", "2026-11-24")];
    expect(calendarEventLanes(events, dates).segments.map(({ start, end }) => [start, end])).toEqual([[4, 6]]);
    expect(calendarEventLanes(events, ["2026-11-23", "2026-11-24", "2026-11-25"]).segments.map(({ start, end }) => [start, end])).toEqual([[0, 1]]);
  });
  it("keeps overlapping events in separate lanes and reuses free lanes", () => {
    const result = calendarEventLanes([event("a", dates[0], dates[2]), event("b", dates[1], dates[4]), event("c", dates[3], dates[6])], dates);
    expect(result.segments.map(({ lane }) => lane)).toEqual([0, 1, 0]);
    expect(result.laneCount).toBe(2);
  });
  it("does not turn single-day or invisible events into bars", () => {
    expect(calendarEventLanes([event("a", dates[0], dates[0]), event("b", "2026-12-01", "2026-12-04")], dates).segments).toEqual([]);
  });
});