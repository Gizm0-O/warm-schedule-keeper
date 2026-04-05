import { useState, useMemo, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, CalendarRange, Briefcase, Home, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  color: string;
  hour?: number; // 0-23
}

const EVENT_COLORS = [
  "bg-primary/20 text-primary border-primary/30",
  "bg-destructive/20 text-destructive border-destructive/30",
  "bg-success/20 text-success border-success/30",
  "bg-warning/20 text-warning border-warning/30",
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
  1: [ // Monday
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
  2: [ // Tuesday
    { person: "Barča", location: "Z domu", startHour: 7, endHour: 14, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
    { person: "Tadeáš", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-home/15", textClass: "text-shift-home", borderClass: "border-shift-home/40", icon: "home" },
  ],
  3: [ // Wednesday
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
  4: [ // Thursday
    { person: "Barča", location: "Z domu", startHour: 7, endHour: 14, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
    { person: "Tadeáš", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-home/15", textClass: "text-shift-home", borderClass: "border-shift-home/40", icon: "home" },
  ],
  5: [ // Friday
    { person: "Tadeáš", location: "Kancelář", startHour: 7, endHour: 14, bgClass: "bg-shift-office/15", textClass: "text-shift-office", borderClass: "border-shift-office/40", icon: "office" },
    { person: "Barča", location: "Z domu", startHour: 14, endHour: 21, bgClass: "bg-shift-partner/15", textClass: "text-shift-partner", borderClass: "border-shift-partner/40", icon: "home" },
  ],
};

const getDefaultShiftsForDay = (day: Date): Shift[] => {
  const dow = getDay(day); // 0=Sun, 1=Mon...
  const isoDay = dow === 0 ? 7 : dow; // convert to 1=Mon..7=Sun
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
  const [now, setNow] = useState(new Date());
  const [swappedDays, setSwappedDays] = useState<Set<string>>(new Set());

  // Update current time every minute
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
      color: EVENT_COLORS[events.length % EVENT_COLORS.length],
      hour: viewMode === "week" ? newEventHour : undefined,
    };
    setEvents((prev) => [...prev, event]);
    setNewEventTitle("");
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const getEventsForDate = (date: Date) =>
    events.filter((e) => e.date === format(date, "yyyy-MM-dd"));

  const getEventsForDateAndHour = (date: Date, hour: number) =>
    events.filter((e) => e.date === format(date, "yyyy-MM-dd") && e.hour === hour);

  // Cumulative top position for each hour
  const getHourTop = (hour: number) =>
    HOURS.slice(0, hour).reduce((sum, h) => sum + getHourHeight(h), 0);
  const totalGridHeight = HOURS.reduce((sum, h) => sum + getHourHeight(h), 0);

  // Current time line position
  const currentHour = now.getHours();
  const currentTimeTop = getHourTop(currentHour) + (now.getMinutes() / 60) * getHourHeight(currentHour);
  const isCurrentWeek = weekDays.some((d) => isSameDay(d, now));
  const currentDayIndex = weekDays.findIndex((d) => isSameDay(d, now));

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
                    <div className="flex w-full flex-col gap-0.5">
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
            {/* Day headers */}
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

            {/* Scrollable time grid */}
            <div className="overflow-y-auto max-h-[600px] relative">
              <div className="relative" style={{ height: totalGridHeight }}>
                {/* Hour rows */}
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
                    {weekDays.map((day) => {
                      const hourEvents = getEventsForDateAndHour(day, hour);
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "border-r border-border/30 px-0.5 cursor-pointer hover:bg-accent/50 transition-colors relative",
                            isToday(day) && "bg-primary/[0.02]"
                          )}
                          onClick={() => {
                            setSelectedDate(day);
                            setNewEventHour(hour);
                          }}
                        >
                          {hourEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={cn(
                                "absolute inset-x-0.5 top-0.5 rounded-md border-l-2 px-1.5 py-0.5 text-[10px] font-medium truncate z-10",
                                ev.color
                              )}
                            >
                              {ev.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  );
                })}

                {/* Shift blocks */}
                {weekDays.map((day, dayIdx) => {
                  const shifts = getShiftsForDay(day);
                  return shifts.map((shift, si) => {
                    const top = getHourTop(shift.startHour);
                    const height = HOURS.slice(shift.startHour, shift.endHour).reduce((s, h) => s + getHourHeight(h), 0);
                    const colWidth = `calc((100% - 60px) / 7)`;
                    const left = `calc(60px + ${dayIdx} * ${colWidth})`;
                    return (
                      <div
                        key={`shift-${dayIdx}-${si}`}
                        className={cn(
                          "absolute rounded-lg border-l-3 pointer-events-none z-[5] flex flex-col justify-start px-1.5 py-1 overflow-hidden",
                          shift.bgClass, shift.borderClass
                        )}
                        style={{ top, height, left, width: colWidth }}
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
                    {/* Time badge aligned to the axis */}
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
                    {/* Line across the grid */}
                    <div
                      className="absolute h-[2px] bg-destructive/60 shadow-[0_0_6px_0] shadow-destructive/30"
                      style={{ left: "60px", right: 0 }}
                    />
                    {/* Dot on current day column */}
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
              <div className="space-y-2">
                {viewMode === "week" && (
                  <select
                    value={newEventHour}
                    onChange={(e) => setNewEventHour(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                )}
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
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné události</p>
                ) : (
                  getEventsForDate(selectedDate).map((ev) => (
                    <div key={ev.id} className={cn("flex items-center justify-between rounded-lg px-3 py-2", ev.color)}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{ev.title}</span>
                        {ev.hour !== undefined && (
                          <span className="text-[10px] opacity-70">
                            {ev.hour.toString().padStart(2, "0")}:00
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeEvent(ev.id)} className="rounded-full p-0.5 hover:bg-foreground/10">
                        <X className="h-3.5 w-3.5" />
                      </button>
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
    </div>
  );
};

export default Index;
