import { useState, useMemo } from "react";
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
}

const EVENT_COLORS = [
  "bg-primary/20 text-primary",
  "bg-destructive/20 text-destructive",
  "bg-success/20 text-success",
  "bg-warning/20 text-warning",
];

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");

  const days = useMemo(() => {
    if (viewMode === "week") {
      const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: currentWeekStart, end });
    }
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth, currentWeekStart, viewMode]);

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
    };
    setEvents((prev) => [...prev, event]);
    setNewEventTitle("");
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const getEventsForDate = (date: Date) =>
    events.filter((e) => e.date === format(date, "yyyy-MM-dd"));

  return (
    <div className="space-y-6">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground capitalize">
          {headerLabel}
        </h2>
        <div className="flex gap-1 items-center">
          {/* View toggle */}
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
        {/* Calendar grid */}
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
              const minH = viewMode === "week" ? "min-h-[160px]" : "min-h-[80px]";
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative flex flex-col items-start rounded-xl p-2 text-sm transition-all hover:bg-accent",
                    minH,
                    viewMode === "month" && !isSameMonth(day, currentMonth) && "opacity-30",
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
                    {dayEvents.slice(0, viewMode === "week" ? 5 : 2).map((ev) => (
                      <div key={ev.id} className={cn("truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium", ev.color)}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > (viewMode === "week" ? 5 : 2) && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - (viewMode === "week" ? 5 : 2)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Event sidebar */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {selectedDate ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {format(selectedDate, "d. MMMM yyyy", { locale: cs })}
              </h3>
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
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné události</p>
                ) : (
                  getEventsForDate(selectedDate).map((ev) => (
                    <div key={ev.id} className={cn("flex items-center justify-between rounded-lg px-3 py-2", ev.color)}>
                      <span className="text-sm font-medium">{ev.title}</span>
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
