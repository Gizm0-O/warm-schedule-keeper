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
} from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, CalendarRange } from "lucide-react";
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
const getHourHeight = (hour: number) => NIGHT_HOURS.has(hour) ? 16 : 40;

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventHour, setNewEventHour] = useState<number>(9);
  const [now, setNow] = useState(new Date());

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
          <Button variant="ghost" size="sm" onClick={goToday}>
            Dnes
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
              <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                {/* Hour rows */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full grid border-b border-border/50"
                    style={{
                      top: hour * HOUR_HEIGHT,
                      height: HOUR_HEIGHT,
                      gridTemplateColumns: "60px repeat(7, 1fr)",
                    }}
                  >
                    <div className="flex items-start justify-end pr-2 pt-1 border-r border-border text-[11px] text-muted-foreground font-medium">
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
                ))}

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
                    {/* Full-width line */}
                    <div
                      className="absolute h-[2px] bg-destructive/70"
                      style={{
                        left: "60px",
                        right: 0,
                      }}
                    />
                    {/* Dot on current day column */}
                    {currentDayIndex >= 0 && (
                      <div
                        className="absolute w-2.5 h-2.5 rounded-full bg-destructive -translate-y-[4px]"
                        style={{
                          left: `calc(60px + ${currentDayIndex} * ((100% - 60px) / 7))`,
                        }}
                      />
                    )}
                    {/* Time label */}
                    <div
                      className="absolute text-[10px] font-bold text-destructive -translate-y-[7px]"
                      style={{ left: "4px" }}
                    >
                      {format(now, "HH:mm")}
                    </div>
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
