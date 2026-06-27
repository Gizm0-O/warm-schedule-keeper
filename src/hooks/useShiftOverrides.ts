import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ShiftTimeOverride {
  startHour: number;
  endHour: number;
}

export interface SwitchBreakOverride {
  start: number;
  end: number;
}

export function useShiftOverrides() {
  const [swappedDays, setSwappedDays] = useState<Set<string>>(new Set());
  const [locationOverrides, setLocationOverrides] = useState<Record<string, boolean>>({});
  const [shiftTimeOverrides, setShiftTimeOverrides] = useState<Record<string, ShiftTimeOverride>>({});
  const [shiftDayOverrides, setShiftDayOverrides] = useState<Record<string, string>>({});
  const [hiddenShifts, setHiddenShifts] = useState<Set<string>>(new Set());
  const [switchBreakOverrides, setSwitchBreakOverrides] = useState<Record<string, SwitchBreakOverride>>({});
  const [hiddenSwitchBreaks, setHiddenSwitchBreaks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load all overrides from DB
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("shift_overrides").select("*");
      if (data) {
        const swaps = new Set<string>();
        const locations: Record<string, boolean> = {};
        const times: Record<string, ShiftTimeOverride> = {};
        const days: Record<string, string> = {};
        const hidden = new Set<string>();
        const sbreaks: Record<string, SwitchBreakOverride> = {};
        const sbreakHidden = new Set<string>();

        for (const row of data) {
          const val = row.value as any;
          switch (row.override_type) {
            case "swap":
              swaps.add(row.shift_key);
              break;
            case "location":
              locations[row.shift_key] = val.toggled ?? true;
              break;
            case "time":
              times[row.shift_key] = { startHour: val.startHour, endHour: val.endHour };
              break;
            case "day":
              days[row.shift_key] = val.targetDay;
              break;
            case "hidden":
              hidden.add(row.shift_key);
              break;
            case "switch_break_time":
              sbreaks[row.shift_key] = { start: val.start, end: val.end };
              break;
            case "switch_break_hidden":
              sbreakHidden.add(row.shift_key);
              break;
          }
        }

        setSwappedDays(swaps);
        setLocationOverrides(locations);
        setShiftTimeOverrides(times);
        setShiftDayOverrides(days);
        setHiddenShifts(hidden);
        setSwitchBreakOverrides(sbreaks);
        setHiddenSwitchBreaks(sbreakHidden);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const upsertOverride = async (shiftKey: string, overrideType: string, value: any) => {
    await supabase.from("shift_overrides").upsert(
      { shift_key: shiftKey, override_type: overrideType, value },
      { onConflict: "shift_key,override_type" }
    );
  };

  const deleteOverride = async (shiftKey: string, overrideType: string) => {
    await supabase.from("shift_overrides")
      .delete()
      .eq("shift_key", shiftKey)
      .eq("override_type", overrideType);
  };

  const toggleSwapDay = useCallback(async (dayKey: string) => {
    setSwappedDays((prev) => {
      const next = new Set(prev);
      const wasSwapped = next.has(dayKey);
      if (wasSwapped) {
        next.delete(dayKey);
        deleteOverride(dayKey, "swap");
      } else {
        next.add(dayKey);
        upsertOverride(dayKey, "swap", { swapped: true });
      }
      return next;
    });
  }, []);

  const toggleLocation = useCallback(async (shiftKey: string) => {
    setLocationOverrides((prev) => {
      const newVal = !prev[shiftKey];
      if (newVal) {
        upsertOverride(shiftKey, "location", { toggled: true });
      } else {
        deleteOverride(shiftKey, "location");
      }
      return { ...prev, [shiftKey]: newVal };
    });
  }, []);

  const setShiftTime = useCallback(async (shiftKey: string, startHour: number, endHour: number) => {
    setShiftTimeOverrides((prev) => ({
      ...prev,
      [shiftKey]: { startHour, endHour },
    }));
    await upsertOverride(shiftKey, "time", { startHour, endHour });
  }, []);

  const updateShiftTimeLocal = useCallback((shiftKey: string, time: ShiftTimeOverride) => {
    setShiftTimeOverrides((prev) => ({ ...prev, [shiftKey]: time }));
  }, []);

  const saveShiftTime = useCallback(async (shiftKey: string) => {
    const time = shiftTimeOverrides[shiftKey];
    if (!time) return;
  }, [shiftTimeOverrides]);

  const setShiftDay = useCallback(async (shiftKey: string, targetDay: string | null) => {
    if (targetDay === null) {
      setShiftDayOverrides((prev) => {
        const next = { ...prev };
        delete next[shiftKey];
        return next;
      });
      await deleteOverride(shiftKey, "day");
    } else {
      setShiftDayOverrides((prev) => ({ ...prev, [shiftKey]: targetDay }));
      await upsertOverride(shiftKey, "day", { targetDay });
    }
  }, []);

  const saveDragResult = useCallback(async (shiftKey: string, sourceDayKey: string) => {
    const time = shiftTimeOverrides[shiftKey];
    const day = shiftDayOverrides[shiftKey];
    
    if (time) {
      await upsertOverride(shiftKey, "time", { startHour: time.startHour, endHour: time.endHour });
    }
    if (day && day !== sourceDayKey) {
      await upsertOverride(shiftKey, "day", { targetDay: day });
    } else if (!day) {
      await deleteOverride(shiftKey, "day");
    }
  }, [shiftTimeOverrides, shiftDayOverrides]);

  const hideShift = useCallback(async (shiftKey: string) => {
    setHiddenShifts((prev) => new Set(prev).add(shiftKey));
    await upsertOverride(shiftKey, "hidden", { hidden: true });
  }, []);

  const unhideShift = useCallback(async (shiftKey: string) => {
    setHiddenShifts((prev) => {
      const next = new Set(prev);
      next.delete(shiftKey);
      return next;
    });
    await deleteOverride(shiftKey, "hidden");
  }, []);

  const deleteShiftOverrides = useCallback(async (shiftKey: string) => {
    await supabase.from("shift_overrides").delete().eq("shift_key", shiftKey);
    setShiftTimeOverrides((prev) => {
      const next = { ...prev };
      delete next[shiftKey];
      return next;
    });
    setShiftDayOverrides((prev) => {
      const next = { ...prev };
      delete next[shiftKey];
      return next;
    });
    setLocationOverrides((prev) => {
      const next = { ...prev };
      delete next[shiftKey];
      return next;
    });
  }, []);

  // ---- Switch break overrides ----
  const setSwitchBreak = useCallback(async (dateKey: string, start: number, end: number) => {
    setSwitchBreakOverrides((prev) => ({ ...prev, [dateKey]: { start, end } }));
    await upsertOverride(dateKey, "switch_break_time", { start, end });
  }, []);

  const updateSwitchBreakLocal = useCallback((dateKey: string, brk: SwitchBreakOverride) => {
    setSwitchBreakOverrides((prev) => ({ ...prev, [dateKey]: brk }));
  }, []);

  const hideSwitchBreak = useCallback(async (dateKey: string) => {
    setHiddenSwitchBreaks((prev) => new Set(prev).add(dateKey));
    await upsertOverride(dateKey, "switch_break_hidden", { hidden: true });
  }, []);

  const restoreSwitchBreak = useCallback(async (dateKey: string) => {
    setHiddenSwitchBreaks((prev) => {
      const next = new Set(prev);
      next.delete(dateKey);
      return next;
    });
    setSwitchBreakOverrides((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
    await deleteOverride(dateKey, "switch_break_hidden");
    await deleteOverride(dateKey, "switch_break_time");
  }, []);

  return {
    swappedDays,
    locationOverrides,
    shiftTimeOverrides,
    shiftDayOverrides,
    hiddenShifts,
    switchBreakOverrides,
    hiddenSwitchBreaks,
    loading,
    toggleSwapDay,
    toggleLocation,
    setShiftTime,
    setShiftDay,
    setShiftTimeOverrides,
    setShiftDayOverrides,
    saveDragResult,
    updateShiftTimeLocal,
    deleteShiftOverrides,
    hideShift,
    unhideShift,
    setSwitchBreak,
    updateSwitchBreakLocal,
    hideSwitchBreak,
    restoreSwitchBreak,
  };
}
