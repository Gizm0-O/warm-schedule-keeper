import { useEffect, useState } from "react";
import { format, subDays, isSameDay } from "date-fns";
import { cs } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Footprints } from "lucide-react";
import { cn } from "@/lib/utils";

const DAILY_GOAL = 8000;

type StepRow = { day: string; count: number };

export default function StepsCard() {
  const [rows, setRows] = useState<StepRow[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const since = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const { data } = await supabase
        .from("steps")
        .select("day,count")
        .gte("day", since)
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

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(today, 6 - i);
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
    <div className="glass rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Footprints className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Kroky · cíl {DAILY_GOAL.toLocaleString("cs-CZ")}
        </h3>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const label = d.isToday ? "Dnes" : format(d.date, "EEEEEE", { locale: cs });
          const numberColor = d.isToday
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
                "flex flex-col items-center gap-1 rounded-lg py-1.5 px-0.5 transition-colors",
                d.isToday && "bg-primary/10"
              )}
            >
              <div className={cn("text-[10px] font-medium uppercase tracking-wide", d.isToday ? "text-primary" : "text-muted-foreground")}>
                {label}
              </div>
              <div className={cn("text-xs font-semibold tabular-nums", numberColor)}>
                {d.count.toLocaleString("cs-CZ")}
              </div>
              <div className="w-full h-8 rounded-full bg-muted/60 overflow-hidden flex items-end">
                <div
                  className={cn("w-full rounded-full transition-all", barColor)}
                  style={{ height: `${d.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
