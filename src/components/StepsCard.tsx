import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Footprints } from "lucide-react";

const DAILY_GOAL = 8000;

type StepRow = { day: string; count: number };

const toLocalYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const normalizeDay = (v: string) => (v || "").slice(0, 10);

export default function StepsCard({
  leadingSpacer = false,
  days: daysProp,
}: {
  leadingSpacer?: boolean;
  days?: Date[];
}) {
  const [byDay, setByDay] = useState<Map<string, number>>(new Map());

  const targetDays = useMemo(() => {
    if (daysProp && daysProp.length === 7) return daysProp;
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - 6 + i);
      return d;
    });
  }, [daysProp]);

  const rangeKey = targetDays.map(toLocalYmd).join(",");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const keys = targetDays.map(toLocalYmd);
      const since = keys[0];
      const until = keys[keys.length - 1];
      const { data, error } = await supabase
        .from("steps")
        .select("day,count")
        .gte("day", since)
        .lte("day", until)
        .order("day", { ascending: true });
      console.log("[StepsCard] range", since, "→", until, "rows:", data, "error:", error);
      if (!alive) return;
      const map = new Map<string, number>();
      ((data as StepRow[] | null) ?? []).forEach((r) => map.set(normalizeDay(r.day), r.count));
      setByDay(map);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const todayKey = toLocalYmd(new Date());

  const cells = targetDays.map((d) => {
    const key = toLocalYmd(d);
    const has = byDay.has(key);
    const count = byDay.get(key) ?? 0;
    return {
      key,
      count,
      has,
      isToday: key === todayKey,
      reached: has && count >= DAILY_GOAL,
      pct: Math.min(100, (count / DAILY_GOAL) * 100),
    };
  });

  const grid = leadingSpacer
    ? { display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", gap: 0 }
    : undefined;

  return (
    <div className={leadingSpacer ? "" : "grid grid-cols-7 gap-1"} style={grid}>
      {leadingSpacer && (
        <div className="flex items-center justify-center">
          <Footprints className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {cells.map((d) => {
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
              "flex flex-col items-center gap-0.5 rounded-md py-1 px-1",
              d.isToday && "bg-primary/10"
            )}
            title={
              d.has
                ? `${d.count.toLocaleString("cs-CZ")} / ${DAILY_GOAL.toLocaleString("cs-CZ")} kroků`
                : "žádná data"
            }
          >
            <div className={cn("text-[11px] font-semibold tabular-nums leading-none", color)}>
              {d.has ? d.count.toLocaleString("cs-CZ") : "–"}
            </div>
            <div className="w-full h-1 rounded-full bg-muted/60 overflow-hidden mt-0.5">
              <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${d.has ? d.pct : 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
