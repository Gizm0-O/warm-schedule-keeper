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
  isBefore,
  startOfDay,
  differenceInDays,
  getDay,
} from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, CalendarRange, Briefcase, Home, ArrowLeftRight, Pencil, AlertCircle, Repeat, Check, Trash2 } from "lucide-react";
import { useCalendarEvents, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { useShiftOverrides } from "@/hooks/useShiftOverrides";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RECURRENCE_LABELS, type Todo } from "@/data/todos";
import { useTodos } from "@/contexts/TodoContext";

type ViewMode = "month" | "week";

// CalendarEvent type imported from hook

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

interface DisplayShift extends Shift {
  shiftKey: string;
  dayKey: string;
  sourceDayKey: string;
  sourceIndex: number;
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
  const { events, setEvents, addEvent: addEventToDb, updateEvent: updateEventInDb, removeEvent: removeEventFromDb } = useCalendarEvents();
  const { todos, toggleTodo } = useTodos();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventHour, setNewEventHour] = useState<number>(9);
  const [newEventEndHour, setNewEventEndHour] = useState<number>(10);
  const [newEventColor, setNewEventColor] = useState(EVENT_COLORS[0].value);
  const [newEventDate, setNewEventDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [now, setNow] = useState(new Date());
  const {
    swappedDays, locationOverrides, shiftTimeOverrides, shiftDayOverrides, hiddenShifts,
    toggleSwapDay, toggleLocation, setShiftTime, setShiftDay,
    setShiftTimeOverrides, setShiftDayOverrides, saveDragResult, deleteShiftOverrides,
    hideShift, unhideShift,
  } = useShiftOverrides();
  const { pushAction } = useUndoRedo();

  // Edit event dialog
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHour, setEditHour] = useState(9);
  const [editEndHour, setEditEndHour] = useState(10);
  const [editColor, setEditColor] = useState(EVENT_COLORS[0].value);

  // Edit shift dialog
  const [editingShift, setEditingShift] = useState<DisplayShift | null>(null);
  const [editShiftStart, setEditShiftStart] = useState(7);
  const [editShiftEnd, setEditShiftEnd] = useState(14);

  // Drag state
  const DRAG_THRESHOLD = 5; // px before drag starts
  const wasDragging = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    type: "event" | "shift";
    id: string;
    mode: "resize-top" | "resize-bottom" | "move";
    origHour: number;
    origEndHour: number;
    origDayIdx: number;
    offsetHour: number; // offset from cursor to block start (for natural move)
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
    const x = clientX - rect.left - 60;
    const colW = (rect.width - 60) / 7;
    return Math.max(0, Math.min(6, Math.floor(x / colW)));
  }, []);

  const onEventDragStart = useCallback((e: React.MouseEvent, ev: CalendarEvent, mode: "resize-top" | "resize-bottom" | "move", dayIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startH = ev.hour ?? 0;
    const endH = ev.endHour ?? startH + 1;
    const cursorHour = hourFromY(e.clientY);
    const offsetHour = cursorHour - startH;
    wasDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragRef.current = { type: "event", id: ev.id, mode, origHour: startH, origEndHour: endH, origDayIdx: dayIdx, offsetHour };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== "event") return;
      // Check threshold
      if (!wasDragging.current && dragStartPos.current) {
        const dx = me.clientX - dragStartPos.current.x;
        const dy = me.clientY - dragStartPos.current.y;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      }
      wasDragging.current = true;
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
            const duration = dragRef.current!.origEndHour - dragRef.current!.origHour;
            const newStart = Math.max(0, Math.min(newHour - dragRef.current!.offsetHour, 24 - duration));
            const wEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
            const wd = eachDayOfInterval({ start: currentWeekStart, end: wEnd });
            const targetDay = wd[newDayIdx];
            return { ...e, hour: newStart, endHour: newStart + duration, date: format(targetDay, "yyyy-MM-dd") };
          }
        })
      );
    };

    const onUp = () => {
      // Save drag result to DB
      if (wasDragging.current && dragRef.current) {
        const ev = events.find((e) => e.id === dragRef.current!.id);
        // We'll handle this via effect - events already updated in state
      }
      const dragId = dragRef.current?.id;
      dragRef.current = null;
      dragStartPos.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // Save updated event to DB after drag
      if (wasDragging.current && dragId) {
        setTimeout(() => {
          setEvents((prev) => {
            const ev = prev.find((e) => e.id === dragId);
            if (ev) {
              updateEventInDb(ev.id, { hour: ev.hour, endHour: ev.endHour, date: ev.date });
            }
            return prev;
          });
        }, 0);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [hourFromY, dayIdxFromX, currentWeekStart]);

  const onShiftDragStart = useCallback((e: React.MouseEvent, sourceDayKey: string, shiftIndex: number, shift: Shift, mode: "resize-top" | "resize-bottom" | "move", dayIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const id = `${sourceDayKey}:${shiftIndex}`;
    const cursorHour = hourFromY(e.clientY);
    const offsetHour = cursorHour - shift.startHour;
    wasDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragRef.current = { type: "shift", id, mode, origHour: shift.startHour, origEndHour: shift.endHour, origDayIdx: dayIdx, offsetHour };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== "shift") return;
      if (!wasDragging.current && dragStartPos.current) {
        const dx = me.clientX - dragStartPos.current.x;
        const dy = me.clientY - dragStartPos.current.y;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      }
      wasDragging.current = true;
      const newHour = hourFromY(me.clientY);
      const newDayIdx = dayIdxFromX(me.clientX);
      const key = dragRef.current.id;

      if (dragRef.current.mode === "move") {
        const duration = dragRef.current.origEndHour - dragRef.current.origHour;
        const newStart = Math.max(0, Math.min(newHour - dragRef.current.offsetHour, 24 - duration));
        const wEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        const wd = eachDayOfInterval({ start: currentWeekStart, end: wEnd });
        const targetDayKey = format(wd[newDayIdx], "yyyy-MM-dd");

        setShiftDayOverrides((prev) => {
          if (targetDayKey === sourceDayKey) {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return { ...prev, [key]: targetDayKey };
        });

        setShiftTimeOverrides((prev) => ({
          ...prev,
          [key]: { startHour: newStart, endHour: newStart + duration },
        }));
        return;
      }

      setShiftTimeOverrides((prev) => {
        const existing = prev[key] ?? { startHour: dragRef.current!.origHour, endHour: dragRef.current!.origEndHour };
        if (dragRef.current!.mode === "resize-bottom") {
          const end = Math.max(newHour + 1, existing.startHour + 1);
          return { ...prev, [key]: { ...existing, endHour: Math.min(end, 24) } };
        }

        const start = Math.min(newHour, existing.endHour - 1);
        return { ...prev, [key]: { ...existing, startHour: Math.max(start, 0) } };
      });
    };

    const onUp = () => {
      const dragId = dragRef.current?.id;
      const wasDrag = wasDragging.current;
      dragRef.current = null;
      dragStartPos.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // Save to DB after drag
      if (wasDrag && dragId) {
        const [srcDay] = dragId.split(":");
        saveDragResult(dragId, srcDay);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [hourFromY, dayIdxFromX, currentWeekStart]);

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

  const addEvent = async () => {
    if (!newEventTitle.trim()) return;
    const dateStr = newEventDate || (selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    const evData = {
      date: dateStr,
      title: newEventTitle.trim(),
      color: newEventColor,
      hour: newEventHour,
      endHour: newEventEndHour,
    };
    const added = await addEventToDb(evData);
    if (added) {
      pushAction({
        undo: () => removeEventFromDb(added.id),
        redo: () => { addEventToDb(evData); },
      });
    }
    setNewEventTitle("");
    setShowNewEventDialog(false);
  };

  const openNewEventDialog = () => {
    setNewEventTitle("");
    setNewEventHour(9);
    setNewEventEndHour(10);
    setNewEventColor(EVENT_COLORS[0].value);
    setNewEventDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    setShowNewEventDialog(true);
  };

  const removeEvent = (id: string) => {
    const ev = events.find((e) => e.id === id);
    removeEventFromDb(id);
    if (ev) {
      pushAction({
        undo: () => addEventToDb({ date: ev.date, title: ev.title, color: ev.color, hour: ev.hour ?? undefined, endHour: ev.endHour ?? undefined }),
        redo: () => removeEventFromDb(id),
      });
    }
  };

  const openEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditHour(ev.hour ?? 9);
    setEditEndHour(ev.endHour ?? (ev.hour !== undefined ? ev.hour + 1 : 10));
    setEditColor(ev.color);
  };

  const saveEditEvent = async () => {
    if (!editingEvent) return;
    await updateEventInDb(editingEvent.id, { title: editTitle, hour: editHour, endHour: editEndHour, color: editColor });
    setEditingEvent(null);
  };

  const openEditShift = (shift: DisplayShift) => {
    setEditingShift(shift);
    const override = shiftTimeOverrides[shift.shiftKey];
    setEditShiftStart(override?.startHour ?? shift.startHour);
    setEditShiftEnd(override?.endHour ?? shift.endHour);
  };

  const saveEditShift = async () => {
    if (!editingShift) return;
    await setShiftTime(editingShift.shiftKey, editShiftStart, editShiftEnd);
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

  const resolveShiftFromKey = (shiftKey: string, dayKey: string): DisplayShift | null => {
    const [sourceDayKey, sourceIndexRaw] = shiftKey.split(":");
    const sourceIndex = Number(sourceIndexRaw);
    const [year, month, day] = sourceDayKey.split("-").map(Number);
    const defaults = getDefaultShiftsForDay(new Date(year, month - 1, day));
    const base = swappedDays.has(sourceDayKey) ? swapShifts(defaults) : defaults;
    const baseShift = base[sourceIndex];

    if (!baseShift) return null;

    let result: Shift = baseShift;
    const timeOverride = shiftTimeOverrides[shiftKey];
    if (timeOverride) {
      result = { ...result, startHour: timeOverride.startHour, endHour: timeOverride.endHour };
    }

    if (locationOverrides[shiftKey]) {
      const isHome = result.location === "Z domu";
      result = {
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

    return {
      ...result,
      shiftKey,
      dayKey,
      sourceDayKey,
      sourceIndex,
    };
  };

  const getShiftsForDay = (day: Date): DisplayShift[] => {
    const dayKey = format(day, "yyyy-MM-dd");
    const defaults = getDefaultShiftsForDay(day);
    const localKeys = defaults
      .map((_, index) => `${dayKey}:${index}`)
      .filter((shiftKey) => (shiftDayOverrides[shiftKey] ?? dayKey) === dayKey && !hiddenShifts.has(shiftKey));

    const incomingKeys = Object.entries(shiftDayOverrides)
      .filter(([shiftKey, targetDayKey]) => targetDayKey === dayKey && !shiftKey.startsWith(`${dayKey}:`) && !hiddenShifts.has(shiftKey))
      .map(([shiftKey]) => shiftKey);

    return [...localKeys, ...incomingKeys]
      .map((shiftKey) => resolveShiftFromKey(shiftKey, dayKey))
      .filter((shift): shift is DisplayShift => shift !== null)
      .sort((a, b) => a.startHour - b.startHour || a.sourceDayKey.localeCompare(b.sourceDayKey) || a.sourceIndex - b.sourceIndex);
  };

  const toggleShiftLocation = (shiftKey: string) => {
    toggleLocation(shiftKey);
  };

  const handleSwapShift = () => {
    if (!selectedDate) return;
    const key = format(selectedDate, "yyyy-MM-dd");
    toggleSwapDay(key);
  };

  // Event spans multiple hours in weekly view
  const getEventBlocksForDay = (day: Date) => {
    const dayEvents = events.filter((e) => e.date === format(day, "yyyy-MM-dd") && e.hour !== undefined);
    return dayEvents;
  };

  const MONTH_GENITIVE = ["ledna","února","března","dubna","května","června","července","srpna","září","října","listopadu","prosince"];
  const todayLabel = useMemo(() => {
    const dayName = format(now, "EEEE", { locale: cs });
    return `Dnes je ${dayName}, ${format(now, "d")}. ${MONTH_GENITIVE[now.getMonth()]}`;
  }, [now]);

  return (
    <div className="space-y-6" onClick={() => setSelectedDate(null)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{todayLabel}</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground capitalize">
            {headerLabel}
          </p>
        <div className="flex gap-1 items-center">
          <Button
            variant="default"
            size="sm"
            className="h-8 px-3 gap-1.5 mr-2"
            onClick={openNewEventDialog}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Událost</span>
          </Button>
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
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Calendar */}
        {viewMode === "month" ? (
          <div className="glass rounded-2xl p-4 animate-fade-in">
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
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(day); }}
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
          <div className="glass rounded-2xl overflow-hidden animate-fade-in">
            <div className="grid border-b border-border" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
              <div className="border-r border-border" />
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(day); }}
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
                        onClick={(e) => {
                          e.stopPropagation();
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
                          "absolute rounded-md border-l-2 px-1.5 py-0.5 text-[10px] font-medium truncate z-10 cursor-grab group hover:opacity-80",
                          ev.color
                        )}
                        style={{ top: top + 2, height: Math.max(height - 4, 16), left, width: `calc(${colWidth} - 4px)`, marginLeft: 2 }}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).dataset.handle) return;
                          onEventDragStart(e, ev, "move", dayIdx);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (wasDragging.current) return;
                          openEditEvent(ev);
                        }}
                      >
                        {/* Top drag handle */}
                        <div
                          data-handle="top"
                          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 flex justify-center items-center"
                          onMouseDown={(e) => onEventDragStart(e, ev, "resize-top", dayIdx)}
                        >
                          <div className="w-6 h-0.5 rounded-full bg-foreground/40 pointer-events-none" />
                        </div>
                        <div className="truncate mt-1">{ev.title}</div>
                        {height > 24 && (
                          <div className="text-[9px] opacity-60">
                            {startH.toString().padStart(2, "0")}:00–{endH.toString().padStart(2, "0")}:00
                          </div>
                        )}
                        {/* Bottom drag handle */}
                        <div
                          data-handle="bottom"
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 flex justify-center items-center"
                          onMouseDown={(e) => onEventDragStart(e, ev, "resize-bottom", dayIdx)}
                        >
                          <div className="w-6 h-0.5 rounded-full bg-foreground/40 pointer-events-none" />
                        </div>
                      </div>
                    );
                  });
                })}

                {/* Shift blocks */}
                {weekDays.map((day, dayIdx) => {
                  const shifts = getShiftsForDay(day);
                  return shifts.map((shift) => {
                    const top = getHourTop(shift.startHour);
                    const height = HOURS.slice(shift.startHour, shift.endHour).reduce((s, h) => s + getHourHeight(h), 0);
                    const colWidth = `calc((100% - 60px) / 7)`;
                    const left = `calc(60px + ${dayIdx} * ${colWidth})`;
                    return (
                      <div
                        key={`shift-${shift.shiftKey}`}
                        className={cn(
                          "absolute rounded-lg border-l-3 pointer-events-auto z-[5] flex flex-col justify-start px-1.5 py-1 overflow-hidden cursor-grab group hover:opacity-80",
                          shift.bgClass, shift.borderClass
                        )}
                        style={{ top, height, left, width: colWidth }}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).dataset.handle) return;
                          onShiftDragStart(e, shift.sourceDayKey, shift.sourceIndex, shift, "move", dayIdx);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (wasDragging.current) return;
                          openEditShift(shift);
                        }}
                      >
                        {/* Top drag handle */}
                        <div
                          data-handle="top"
                          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 flex justify-center items-center z-10"
                          onMouseDown={(e) => onShiftDragStart(e, shift.sourceDayKey, shift.sourceIndex, shift, "resize-top", dayIdx)}
                        >
                          <div className="w-8 h-0.5 rounded-full bg-foreground/30 pointer-events-none" />
                        </div>
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
                        {/* Bottom drag handle */}
                        <div
                          data-handle="bottom"
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 flex justify-center items-center z-10"
                          onMouseDown={(e) => onShiftDragStart(e, shift.sourceDayKey, shift.sourceIndex, shift, "resize-bottom", dayIdx)}
                        >
                          <div className="w-8 h-0.5 rounded-full bg-foreground/30 pointer-events-none" />
                        </div>
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
        <div className="glass rounded-2xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
          {selectedDate ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {format(selectedDate, "d. MMMM yyyy", { locale: cs })}
              </h3>

              {/* Shifts for selected day */}
              {viewMode === "week" && (() => {
                const dayShifts = getShiftsForDay(selectedDate);
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
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.shiftKey}
                        className={cn(
                          "flex items-center justify-between rounded-lg border-l-3 px-3 py-2.5",
                          shift.bgClass, shift.borderClass
                        )}
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => openEditShift(shift)}
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
                          onClick={() => toggleShiftLocation(shift.shiftKey)}
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
            (() => {
              const today = startOfDay(new Date());
              const urgentTodos = todos.filter((t) => {
                if (t.completed || !t.deadline) return false;
                const target = startOfDay(t.deadline);
                return isBefore(target, today) || isSameDay(target, today);
              });
              const workTodos = urgentTodos.filter((t) => t.category === "work").sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime());
              const homeTodos = urgentTodos.filter((t) => t.category === "home").sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime());

              const TodoItem = ({ todo }: { todo: Todo }) => {
                const target = startOfDay(todo.deadline!);
                const isOverdue = isBefore(target, today);
                const isTodayTask = isSameDay(target, today);
                const daysLate = isOverdue ? differenceInDays(today, target) : 0;
                return (
                  <div className={cn(
                    "relative flex items-start gap-3 px-3 py-2 rounded-lg text-sm border",
                    todo.person === "Tadeáš"
                      ? "border-shift-office/30"
                      : "border-shift-partner/30",
                    isOverdue && "bg-destructive/5",
                    isTodayTask && !isOverdue && "bg-warning/10"
                  )}>
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-0.5",
                        todo.person === "Tadeáš"
                          ? "border-shift-office/40 hover:border-shift-office hover:bg-shift-office/10"
                          : "border-shift-partner/40 hover:border-shift-partner hover:bg-shift-partner/10"
                      )}
                    >
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground inline-flex items-center gap-1.5">
                        {todo.text}
                        {todo.recurrence !== "none" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-normal">
                            <Repeat className="h-3 w-3" />
                            {RECURRENCE_LABELS[todo.recurrence]}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs",
                          isOverdue && "text-destructive font-medium",
                          isTodayTask && !isOverdue && "font-medium text-orange-700 dark:text-orange-300"
                        )}>
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          <CalendarDays className="h-3 w-3" />
                          {isTodayTask ? "Dnes" : format(todo.deadline!, "d.M.", { locale: cs })}
                          {isOverdue && (
                            <span className="text-destructive font-semibold ml-0.5">
                              ({daysLate} {daysLate === 1 ? "den" : daysLate < 5 ? "dny" : "dní"} zpoždění)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 h-4",
                      todo.person === "Tadeáš"
                        ? "border-shift-office/40 bg-shift-office/10 text-shift-office"
                        : "border-shift-partner/40 bg-shift-partner/10 text-shift-partner"
                    )}>
                      {todo.person}
                    </Badge>
                  </div>
                );
              };

              if (workTodos.length === 0 && homeTodos.length === 0) {
                return <p className="text-sm text-muted-foreground">Žádné úkoly na dnes 🎉</p>;
              }

              return (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Dnešní úkoly</h3>
                  {workTodos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Práce ({workTodos.length})</span>
                      </div>
                      <div className="space-y-1">
                        {workTodos.map((t) => <TodoItem key={t.id} todo={t} />)}
                      </div>
                    </div>
                  )}
                  {homeTodos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domácnost ({homeTodos.length})</span>
                      </div>
                      <div className="space-y-1">
                        {homeTodos.map((t) => <TodoItem key={t.id} todo={t} />)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
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
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (editingEvent) {
                  removeEvent(editingEvent.id);
                  setEditingEvent(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Smazat
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingEvent(null)}>Zrušit</Button>
              <Button onClick={saveEditEvent}>Uložit</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={!!editingShift} onOpenChange={(open) => !open && setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <DialogTitle className="flex-1">Upravit směnu – {editingShift?.person}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Přehodit směny"
                onClick={() => {
                  if (!editingShift) return;
                  toggleSwapDay(editingShift.dayKey);
                  setEditingShift(null);
                }}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              {editingShift?.person === "Tadeáš" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={editingShift.icon === "office" ? "Změnit na Z domu" : "Změnit na Kancelář"}
                  onClick={() => {
                    if (!editingShift) return;
                    toggleShiftLocation(editingShift.shiftKey);
                    setEditingShift(null);
                  }}
                >
                  {editingShift.icon === "office" ? <Home className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
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
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (editingShift) {
                  const key = editingShift.shiftKey;
                  await hideShift(key);
                  pushAction({
                    undo: () => unhideShift(key),
                    redo: () => hideShift(key),
                  });
                  setEditingShift(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Smazat
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingShift(null)}>Zrušit</Button>
              <Button onClick={saveEditShift}>Uložit</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* New Event Dialog */}
      <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nová událost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Název</label>
              <Input
                placeholder="Název události..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEvent()}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Datum</label>
              <Input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Od</label>
                <select
                  value={newEventHour}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setNewEventHour(v);
                    if (newEventEndHour <= v) setNewEventEndHour(Math.min(v + 1, 23));
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
                  value={newEventEndHour}
                  onChange={(e) => setNewEventEndHour(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HOURS.filter((h) => h > newEventHour).map((h) => (
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
                    onClick={() => setNewEventColor(c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      c.value.split(" ")[0],
                      newEventColor === c.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEventDialog(false)}>Zrušit</Button>
            <Button onClick={addEvent} disabled={!newEventTitle.trim()}>Vytvořit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
