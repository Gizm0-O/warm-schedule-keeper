import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { cs } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Footprints } from "lucide-react";

type StepRow = { day: string; count: number };

export default function StepsCard() {
  const [rows, setRows] = useState<StepRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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

  const today = format(new Date(), "yyyy-MM-dd");
  const todayCount = rows.find((r) => r.day === today)?.count;

  // Build last 7 days array (fill missing with 0)
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd");
    return {
      day: key,
      label: format(d, "EEEEEE", { locale: cs }),
      count: byDay.get(key) ?? 0,
    };
  });

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Kroky dnes</h3>
        </div>
        <div className="text-3xl font-bold tabular-nums">
          {loading ? "…" : todayCount != null ? todayCount.toLocaleString("cs-CZ") : "—"}
        </div>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [v.toLocaleString("cs-CZ"), "Kroky"]}
              labelFormatter={(_, p) => (p?.[0]?.payload?.day as string) ?? ""}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
