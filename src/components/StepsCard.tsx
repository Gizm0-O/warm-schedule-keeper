import { useEffect, useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cs } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const DAILY_GOAL = 8000;

type StepRow = { day: string; count: number };

export default function StepsCard() {
  const [rows, setRows] = useState<StepRow[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const since = format(weekStart, "yyyy-MM-dd");
      const until = format(addDays(weekStart, 6), "yyyy-MM-dd");
      const { data } = await supabase
        .from("steps")
        .select("day,count")
        .gte("day", since)
        .lte("day", until)
        .order("day", { ascending: true });
      if (!alive) return;
      setRows((data as StepRow[] | null) ?? []);
    };
    load();

    const channel = supabase
      .channel("steps-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "steps" }, load)
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(weekStart, i);
    const key = format(d, "yyyy-MM-dd");
    const count = byDay.get(key) ?? 0;
    return {
      date: d,
      key,
      count,
      isToday: isSameDay(d, today),
      reached: count >= DAILY_GOAL,
      pct: Math.min(100, (count / DAILY_GOAL) * 100),
    };
  });

  return (
    <div className="grid grid-cols-7 gap-1 px-1">
      {days.map((d) => {
        const label = format(d.date, "EEEEEE", { locale: cs });
        const color = d.isToday
          ? "text-primary"
          : d.reached
          ? "text-success"
          : "text-muted-foreground";
        const barColor = d.isToday
          ? "bg-primary"
          : d.reached
          ? "bg-success"
          : "bg-muted-foreground/40";
        return (
          <div
            key={d.key}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md py-1",
              d.isToday && "bg-primary/10"
            )}
            title={`${d.count.toLocaleString("cs-CZ")} / ${DAILY_GOAL.toLocaleString("cs-CZ")} kroků`}
          >
            <div className={cn("text-[10px] font-semibold uppercase tracking-wider", d.isToday ? "text-primary" : "text-muted-foreground/70")}>
              {label}
            </div>
            <div className={cn("text-[11px] font-semibold tabular-nums leading-none", color)}>
              {d.count.toLocaleString("cs-CZ")}
            </div>
            <div className="w-full h-1 rounded-full bg-muted/60 overflow-hidden mt-0.5">
              <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${d.pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
