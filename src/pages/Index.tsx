import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
} from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, CalendarRange, Briefcase, Home, ArrowLeftRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  color: string;
  hour?: number;
  endHour?: number;
}

const EVENT_COLORS = [
  { label: "Zelená", value: "bg-primary/20 text-primary border-primary/30" },
  { label: "Červená", value: "bg-destructive/20 text-destructive border-destructive/30" },
  { label: "Zelená tmavá", value: "bg-success/20 text-success border-success/30" },
  { label: "Oranžová", value: "bg-warning/20 text-warning border-warning/30" },
];

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const NIGHT_HOURS = new Set([0, 1, 2, 3, 4, 5]);
const getHourHeight = (hour: number) => NIGHT_HOURS.has(hour) ? 14 : 36;

// Shift definitions
interface Shift {
  person: string;
  location: string;
  startHour: number;
  endHour: number;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: "office" | "home";
}

// day of week (1=Mon..5=Fri) -> shifts
const SHIFT_SCHEDULE: Record<number, Shift[]> = {
  1: [
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
  2: [
    { person: "Barča", location: "Z domu", startHour: 7, endHour: 14, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
    { person: "Tadeáš", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-home/15", textClass: "text-shift-home", borderClass: "border-shift-home/40", icon: "home" },
  ],
  3: [
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
  4: [
    { person: "Barča", location: "Z domu", startHour: 7, endHour: 14, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
    { person: "Tadeáš", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-home/15", textClass: "text-shift-home", borderClass: "border-shift-home/40", icon: "home" },
  ],
  5: [
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
};

const getDefaultShiftsForDay = (day: Date): Shift[] => {
  const dow = getDay(day);
  const isoDay = dow === 0 ? 7 : dow;
  return SHIFT_SCHEDULE[isoDay] || [];
};

const swapShifts = (shifts: Shift[]): Shift[] => {
  if (shifts.length !== 2) return shifts;
  const [morning, afternoon] = shifts;
  return [
    { ...afternoon, startHour: 7, endHour: 14 },
    { ...morning, startHour: 14, endHour: 21 },
  ];
};

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventHour, setNewEventHour] = useState<number>(9);
  const [newEventEndHour, setNewEventEndHour] = useState<number>(10);
  const [newEventColor, setNewEventColor] = useState(EVENT_COLORS[0].value);
  const [now, setNow] = useState(new Date());
  const [swappedDays, setSwappedDays] = useState<Set<string>>(new Set());
  const [locationOverrides, setLocationOverrides] = useState<Record<string, boolean>>({});

  // Edit event dialog
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHour, setEditHour] = useState(9);
  const [editEndHour, setEditEndHour] = useState(10);
  const [editColor, setEditColor] = useState(EVENT_COLORS[0].value);

  // Edit shift dialog
  const [editingShift, setEditingShift] = useState<{ dayKey: string; index: number; shift: Shift } | null>(null);
  const [editShiftStart, setEditShiftStart] = useState(7);
  const [editShiftEnd, setEditShiftEnd] = useState(14);
  // key: "yyyy-MM-dd:shiftIndex" -> { startHour, endHour }
  const [shiftTimeOverrides, setShiftTimeOverrides] = useState<Record<string, { startHour: number; endHour: number }>>({});

  // Drag state
  const dragRef = useRef<{
    type: "event" | "shift";
    id: string; // eventId or "dayKey:shiftIndex"
    mode: "resize-top" | "resize-bottom" | "move";
    origHour: number;
    origEndHour: number;
    origDayIdx: number;
    moved: boolean;
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const hourFromY = useCallback((clientY: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = clientY - rect.top + timelineRef.current.scrollTop;
    let acc = 0;
    for (const h of HOURS) {
      const hh = getHourHeight(h);
      if (y < acc + hh) return h;
      acc += hh;
    }
    return 23;
  }, []);

  const dayIdxFromX = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left - 60; // subtract time label column
    const colW = (rect.width - 60) / 7;
    return Math.max(0, Math.min(6, Math.floor(x / colW)));
  }, []);

  const onEventDragStart = useCallback((e: React.MouseEvent, ev: CalendarEvent, mode: "resize-top" | "resize-bottom" | "move", dayIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startH = ev.hour ?? 0;
    const endH = ev.endHour ?? startH + 1;
    dragRef.current = { type: "event", id: ev.id, mode, origHour: startH, origEndHour: endH, origDayIdx: dayIdx, moved: false };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== "event") return;
      dragRef.current.moved = true;
      const newHour = hourFromY(me.clientY);
      const newDayIdx = dayIdxFromX(me.clientX);

      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== dragRef.current!.id) return e;
          if (dragRef.current!.mode === "resize-bottom") {
            const end = Math.max(newHour + 1, (e.hour ?? 0) + 1);
            return { ...e, endHour: Math.min(end, 24) };
          } else if (dragRef.current!.mode === "resize-top") {
            const start = Math.min(newHour, (e.endHour ?? 1) - 1);
            return { ...e, hour: Math.max(start, 0) };
          } else {
            // move
            const duration = dragRef.current!.origEndHour - dragRef.current!.origHour;
            const newStart = Math.max(0, Math.min(newHour, 24 - duration));
            const targetDay = weekDays[newDayIdx];
            return { ...e, hour: newStart, endHour: newStart + duration, date: format(targetDay, "yyyy-MM-dd") };
          }
        })
      );
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [hourFromY, dayIdxFromX, currentWeekStart]);

  const onShiftDragStart = useCallback((e: React.MouseEvent, dateKey: string, shiftIndex: number, shift: Shift, mode: "resize-top" | "resize-bottom" | "move") => {
    e.preventDefault();
    e.stopPropagation();
    const id = `${dateKey}:${shiftIndex}`;
    dragRef.current = { type: "shift", id, mode, origHour: shift.startHour, origEndHour: shift.endHour, origDayIdx: 0, moved: false };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== "shift") return;
      dragRef.current.moved = true;
      const newHour = hourFromY(me.clientY);
      const key = dragRef.current.id;

      setShiftTimeOverrides((prev) => {
        const existing = prev[key] ?? { startHour: dragRef.current!.origHour, endHour: dragRef.current!.origEndHour };
        if (dragRef.current!.mode === "resize-bottom") {
          const end = Math.max(newHour + 1, existing.startHour + 1);
          return { ...prev, [key]: { ...existing, endHour: Math.min(end, 24) } };
        } else if (dragRef.current!.mode === "resize-top") {
          const start = Math.min(newHour, existing.endHour - 1);
          return { ...prev, [key]: { ...existing, startHour: Math.max(start, 0) } };
        } else {
          // move
          const duration = dragRef.current!.origEndHour - dragRef.current!.origHour;
          const newStart = Math.max(0, Math.min(newHour, 24 - duration));
          return { ...prev, [key]: { startHour: newStart, endHour: newStart + duration } };
        }
      });
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [hourFromY]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const days = useMemo(() => {
    if (viewMode === "week") {
      const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: currentWeekStart, end });
    }
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth, currentWeekStart, viewMode]);

  const weekDays = useMemo(() => {
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end });
  }, [currentWeekStart]);

  const goBack = () => {
    if (viewMode === "month") setCurrentMonth(subMonths(currentMonth, 1));
    else setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goForward = () => {
    if (viewMode === "month") setCurrentMonth(addMonths(currentMonth, 1));
    else setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToday = () => {
    setCurrentMonth(new Date());
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const todayButtonLabel = useMemo(() => {
    if (viewMode === "month") {
      const label = format(currentMonth, "LLLL", { locale: cs });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    const we = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return `${format(currentWeekStart, "d.M.")}–${format(we, "d.M.")}`;
  }, [viewMode, currentMonth, currentWeekStart]);

  const headerLabel =
    viewMode === "month"
      ? format(currentMonth, "LLLL yyyy", { locale: cs })
      : `${format(currentWeekStart, "d. MMM", { locale: cs })} – ${format(
          endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
          "d. MMM yyyy",
          { locale: cs }
        )}`;

  const addEvent = () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      date: format(selectedDate, "yyyy-MM-dd"),
      title: newEventTitle.trim(),
      color: newEventColor,
      hour: viewMode === "week" ? newEventHour : undefined,
      endHour: viewMode === "week" ? newEventEndHour : undefined,
    };
    setEvents((prev) => [...prev, event]);
    setNewEventTitle("");
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const openEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditHour(ev.hour ?? 9);
    setEditEndHour(ev.endHour ?? (ev.hour !== undefined ? ev.hour + 1 : 10));
    setEditColor(ev.color);
  };

  const saveEditEvent = () => {
    if (!editingEvent) return;
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === editingEvent.id
          ? { ...ev, title: editTitle, hour: editHour, endHour: editEndHour, color: editColor }
          : ev
      )
    );
    setEditingEvent(null);
  };

  const openEditShift = (dayKey: string, index: number, shift: Shift) => {
    setEditingShift({ dayKey, index, shift });
    const overrideKey = `${dayKey}:${index}`;
    const override = shiftTimeOverrides[overrideKey];
    setEditShiftStart(override?.startHour ?? shift.startHour);
    setEditShiftEnd(override?.endHour ?? shift.endHour);
  };

  const saveEditShift = () => {
    if (!editingShift) return;
    const key = `${editingShift.dayKey}:${editingShift.index}`;
    setShiftTimeOverrides((prev) => ({
      ...prev,
      [key]: { startHour: editShiftStart, endHour: editShiftEnd },
    }));
    setEditingShift(null);
  };

  const getEventsForDate = (date: Date) =>
    events.filter((e) => e.date === format(date, "yyyy-MM-dd"));

  const getEventsForDateAndHour = (date: Date, hour: number) =>
    events.filter((e) => e.date === format(date, "yyyy-MM-dd") && e.hour === hour);

  const getHourTop = (hour: number) =>
    HOURS.slice(0, hour).reduce((sum, h) => sum + getHourHeight(h), 0);
  const totalGridHeight = HOURS.reduce((sum, h) => sum + getHourHeight(h), 0);

  const currentHour = now.getHours();
  const currentTimeTop = getHourTop(currentHour) + (now.getMinutes() / 60) * getHourHeight(currentHour);
  const isCurrentWeek = weekDays.some((d) => isSameDay(d, now));
  const currentDayIndex = weekDays.findIndex((d) => isSameDay(d, now));

  const getShiftsForDay = (day: Date): Shift[] => {
    const defaults = getDefaultShiftsForDay(day);
    const dateKey = format(day, "yyyy-MM-dd");
    const base = swappedDays.has(dateKey) ? swapShifts(defaults) : defaults;
    return base.map((shift, i) => {
      const overrideKey = `${dateKey}:${i}`;
      let result = shift;

      // Apply time overrides
      const timeOverride = shiftTimeOverrides[overrideKey];
      if (timeOverride) {
        result = { ...result, startHour: timeOverride.startHour, endHour: timeOverride.endHour };
      }

      // Apply location overrides
      if (locationOverrides[overrideKey]) {
        const isHome = result.location === "Z domu";
        return {
          ...result,
          location: isHome ? "Kancelář" : "Z domu",
          icon: isHome ? "office" as const : "home" as const,
          bgClass: result.person === "Tadeáš"
            ? (isHome ? "bg-shift-office/15" : "bg-shift-home/15")
            : result.bgClass,
          textClass: result.person === "Tadeáš"
            ? (isHome ? "text-shift-office" : "text-shift-home")
            : result.textClass,
          borderClass: result.person === "Tadeáš"
            ? (isHome ? "border-shift-office/40" : "border-shift-home/40")
            : result.borderClass,
        };
      }
      return result;
    });
  };

  const toggleShiftLocation = (dayDate: Date, shiftIndex: number) => {
    const key = `${format(dayDate, "yyyy-MM-dd")}:${shiftIndex}`;
    setLocationOverrides((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSwapShift = () => {
    if (!selectedDate) return;
    const key = format(selectedDate, "yyyy-MM-dd");
    setSwappedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Event spans multiple hours in weekly view
  const getEventBlocksForDay = (day: Date) => {
    const dayEvents = events.filter((e) => e.date === format(day, "yyyy-MM-dd") && e.hour !== undefined);
    return dayEvents;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground capitalize">
          {headerLabel}
        </h2>
        <div className="flex gap-1 items-center">
          <div className="flex rounded-lg border border-border bg-muted p-0.5 mr-2">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 gap-1.5"
              onClick={() => setViewMode("month")}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Měsíc</span>
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 gap-1.5"
              onClick={() => setViewMode("week")}
            >
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Týden</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">
            {todayButtonLabel}
          </Button>
          <Button variant="ghost" size="icon" onClick={goForward}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Calendar */}
        {viewMode === "month" ? (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dayEvents = getEventsForDate(day);
                const dayShifts = getShiftsForDay(day);
                const selected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative flex min-h-[80px] flex-col items-start rounded-xl p-2 text-sm transition-all hover:bg-accent",
                      !isSameMonth(day, currentMonth) && "opacity-30",
                      selected && "ring-2 ring-primary bg-accent",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day) && "bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayShifts.length > 0 && (
                      <div className="flex flex-col gap-0.5 w-full">
                        {dayShifts.map((shift, si) => (
                          <div key={si} className={cn("flex items-center gap-1 rounded px-1 py-0.5", shift.bgClass)}>
                            <span className={cn("text-[10px] font-bold leading-none", shift.textClass)}>
                              {shift.person.charAt(0)}
                            </span>
                            {shift.icon === "office"
                              ? <Briefcase className={cn("h-2.5 w-2.5", shift.textClass)} />
                              : <Home className={cn("h-2.5 w-2.5", shift.textClass)} />}
                            <span className={cn("text-[9px] opacity-60 leading-none", shift.textClass)}>
                              {shift.startHour}–{shift.endHour}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex w-full flex-col gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} className={cn("truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium", ev.color)}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Weekly timeline view */
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="grid border-b border-border" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
              <div className="border-r border-border" />
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center py-3 transition-colors hover:bg-accent",
                    selectedDate && isSameDay(day, selectedDate) && "bg-accent",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    {format(day, "EEEEEE", { locale: cs })}
                  </span>
                  <span
                    className={cn(
                      "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[600px] relative" ref={timelineRef}>
              <div className="relative" style={{ height: totalGridHeight }}>
                {HOURS.map((hour) => {
                  const h = getHourHeight(hour);
                  const top = getHourTop(hour);
                  const isNight = NIGHT_HOURS.has(hour);
                  return (
                  <div
                    key={hour}
                    className="absolute w-full grid border-b border-border/50"
                    style={{
                      top,
                      height: h,
                      gridTemplateColumns: "60px repeat(7, 1fr)",
                    }}
                  >
                    <div className={cn(
                      "flex items-start justify-end pr-2 border-r border-border font-medium",
                      isNight ? "text-[9px] text-muted-foreground/50 pt-0.5" : "text-[11px] text-muted-foreground pt-1"
                    )}>
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "border-r border-border/30 px-0.5 cursor-pointer hover:bg-accent/50 transition-colors relative",
                          isToday(day) && "bg-primary/[0.02]"
                        )}
                        onClick={() => {
                          setSelectedDate(day);
                          setNewEventHour(hour);
                          setNewEventEndHour(Math.min(hour + 1, 23));
                        }}
                      />
                    ))}
                  </div>
                  );
                })}

                {/* Event blocks spanning hours */}
                {weekDays.map((day, dayIdx) => {
                  const dayEvents = getEventBlocksForDay(day);
                  const colWidth = `calc((100% - 60px) / 7)`;
                  return dayEvents.map((ev) => {
                    const startH = ev.hour!;
                    const endH = ev.endHour ?? startH + 1;
                    const top = getHourTop(startH);
                    const height = HOURS.slice(startH, endH).reduce((s, h) => s + getHourHeight(h), 0);
                    const left = `calc(60px + ${dayIdx} * ${colWidth})`;
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          "absolute rounded-md border-l-2 px-1.5 py-0.5 text-[10px] font-medium truncate z-10 cursor-pointer group hover:opacity-80",
                          ev.color
                        )}
                        style={{ top: top + 2, height: Math.max(height - 4, 16), left, width: `calc(${colWidth} - 4px)`, marginLeft: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditEvent(ev);
                        }}
                      >
                        {/* Top drag handle */}
                        <div
                          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 flex justify-center items-center"
                          onMouseDown={(e) => onDragStart(e, ev.id, "top", startH, endH)}
                        >
                          <div className="w-6 h-0.5 rounded-full bg-foreground/40" />
                        </div>
                        <div className="truncate mt-1">{ev.title}</div>
                        {height > 24 && (
                          <div className="text-[9px] opacity-60">
                            {startH.toString().padStart(2, "0")}:00–{endH.toString().padStart(2, "0")}:00
                          </div>
                        )}
                        {/* Bottom drag handle */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 flex justify-center items-center"
                          onMouseDown={(e) => onDragStart(e, ev.id, "bottom", startH, endH)}
                        >
                          <div className="w-6 h-0.5 rounded-full bg-foreground/40" />
                        </div>
                      </div>
                    );
                  });
                })}

                {/* Shift blocks */}
                {weekDays.map((day, dayIdx) => {
                  const shifts = getShiftsForDay(day);
                  const dateKey = format(day, "yyyy-MM-dd");
                  return shifts.map((shift, si) => {
                    const top = getHourTop(shift.startHour);
                    const height = HOURS.slice(shift.startHour, shift.endHour).reduce((s, h) => s + getHourHeight(h), 0);
                    const colWidth = `calc((100% - 60px) / 7)`;
                    const left = `calc(60px + ${dayIdx} * ${colWidth})`;
                    return (
                      <div
                        key={`shift-${dayIdx}-${si}`}
                        className={cn(
                          "absolute rounded-lg border-l-3 pointer-events-auto z-[5] flex flex-col justify-start px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-80",
                          shift.bgClass, shift.borderClass
                        )}
                        style={{ top, height, left, width: colWidth }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditShift(dateKey, si, shift);
                        }}
                      >
                        <div className={cn("flex items-center gap-1.5", shift.textClass)}>
                          {shift.icon === "office" ? <Briefcase className="h-3.5 w-3.5 shrink-0" /> : <Home className="h-3.5 w-3.5 shrink-0" />}
                          <span className="text-xs font-bold truncate">{shift.person}</span>
                        </div>
                        {shift.location && (
                          <span className={cn("text-[11px] font-medium opacity-70 mt-0.5", shift.textClass)}>
                            {shift.location}
                          </span>
                        )}
                        <span className={cn("text-[11px] opacity-50 mt-auto", shift.textClass)}>
                          {shift.startHour}:00–{shift.endHour}:00
                        </span>
                      </div>
                    );
                  });
                })}

                {/* Current time indicator */}
                {isCurrentWeek && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      top: currentTimeTop,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <div
                      className="absolute flex items-center -translate-y-1/2"
                      style={{ left: 0, width: "60px" }}
                    >
                      <div className="w-full flex justify-end pr-1.5">
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm shadow-destructive/30">
                          {format(now, "HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div
                      className="absolute h-[2px] bg-destructive/60 shadow-[0_0_6px_0] shadow-destructive/30"
                      style={{ left: "60px", right: 0 }}
                    />
                    {currentDayIndex >= 0 && (
                      <div
                        className="absolute w-3 h-3 rounded-full bg-destructive -translate-y-[5px] shadow-md shadow-destructive/40"
                        style={{
                          left: `calc(60px + ${currentDayIndex} * ((100% - 60px) / 7))`,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event sidebar */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {selectedDate ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {format(selectedDate, "d. MMMM yyyy", { locale: cs })}
              </h3>

              {/* Shifts for selected day */}
              {viewMode === "week" && (() => {
                const dayShifts = getShiftsForDay(selectedDate);
                const dateKey = format(selectedDate, "yyyy-MM-dd");
                if (dayShifts.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Směny</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1.5"
                        onClick={handleSwapShift}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Přehodit
                      </Button>
                    </div>
                    {dayShifts.map((shift, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between rounded-lg border-l-3 px-3 py-2.5",
                          shift.bgClass, shift.borderClass
                        )}
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => openEditShift(dateKey, idx, shift)}
                        >
                          {shift.icon === "office" ? <Briefcase className={cn("h-4 w-4", shift.textClass)} /> : <Home className={cn("h-4 w-4", shift.textClass)} />}
                          <div className="flex flex-col">
                            <span className={cn("text-sm font-semibold", shift.textClass)}>{shift.person}</span>
                            <span className={cn("text-xs opacity-70", shift.textClass)}>
                              {shift.startHour}:00–{shift.endHour}:00 · {shift.location}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => toggleShiftLocation(selectedDate, idx)}
                        >
                          {shift.location === "Z domu" ? <Briefcase className="h-3.5 w-3.5" /> : <Home className="h-3.5 w-3.5" />}
                          {shift.location === "Z domu" ? "Kancelář" : "Z domu"}
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Add event form */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nová událost</h4>
                {viewMode === "week" && (
                  <div className="flex gap-2">
                    <select
                      value={newEventHour}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setNewEventHour(v);
                        if (newEventEndHour <= v) setNewEventEndHour(Math.min(v + 1, 23));
                      }}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>Od {h.toString().padStart(2, "0")}:00</option>
                      ))}
                    </select>
                    <select
                      value={newEventEndHour}
                      onChange={(e) => setNewEventEndHour(Number(e.target.value))}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {HOURS.filter((h) => h > newEventHour).map((h) => (
                        <option key={h} value={h}>Do {h.toString().padStart(2, "0")}:00</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Color picker */}
                <div className="flex gap-1.5">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewEventColor(c.value)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-all",
                        c.value.split(" ")[0],
                        newEventColor === c.value ? "border-foreground scale-110" : "border-transparent"
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nová událost..."
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEvent()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={addEvent}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Event list */}
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné události</p>
                ) : (
                  getEventsForDate(selectedDate).map((ev) => (
                    <div key={ev.id} className={cn("flex items-center justify-between rounded-lg px-3 py-2", ev.color)}>
                      <div
                        className="flex flex-col cursor-pointer flex-1"
                        onClick={() => openEditEvent(ev)}
                      >
                        <span className="text-sm font-medium">{ev.title}</span>
                        {ev.hour !== undefined && (
                          <span className="text-[10px] opacity-70">
                            {ev.hour.toString().padStart(2, "0")}:00
                            {ev.endHour !== undefined && `–${ev.endHour.toString().padStart(2, "0")}:00`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditEvent(ev)} className="rounded-full p-0.5 hover:bg-foreground/10">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeEvent(ev.id)} className="rounded-full p-0.5 hover:bg-foreground/10">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Klikněte na den pro zobrazení a přidání událostí</p>
          )}
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit událost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Název</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Od</label>
                <select
                  value={editHour}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEditHour(v);
                    if (editEndHour <= v) setEditEndHour(Math.min(v + 1, 23));
                  }}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Do</label>
                <select
                  value={editEndHour}
                  onChange={(e) => setEditEndHour(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.filter((h) => h > editHour).map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Barva</label>
              <div className="flex gap-2 mt-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setEditColor(c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      c.value.split(" ")[0],
                      editColor === c.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Zrušit</Button>
            <Button onClick={saveEditEvent}>Uložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={!!editingShift} onOpenChange={(open) => !open && setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <DialogTitle className="flex-1">Upravit směnu – {editingShift?.shift.person}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Přehodit směny"
                onClick={() => {
                  if (!editingShift) return;
                  const key = editingShift.dayKey;
                  setSwappedDays((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                  setEditingShift(null);
                }}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              {editingShift?.shift.person === "Tadeáš" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={editingShift.shift.icon === "office" ? "Změnit na Z domu" : "Změnit na Kancelář"}
                  onClick={() => {
                    if (!editingShift) return;
                    toggleShiftLocation(new Date(editingShift.dayKey), editingShift.index);
                    setEditingShift(null);
                  }}
                >
                  {editingShift.shift.icon === "office" ? <Home className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Od</label>
                <select
                  value={editShiftStart}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEditShiftStart(v);
                    if (editShiftEnd <= v) setEditShiftEnd(Math.min(v + 1, 23));
                  }}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Do</label>
                <select
                  value={editShiftEnd}
                  onChange={(e) => setEditShiftEnd(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.filter((h) => h > editShiftStart).map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingShift(null)}>Zrušit</Button>
            <Button onClick={saveEditShift}>Uložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
