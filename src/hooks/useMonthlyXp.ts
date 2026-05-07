import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTaskEarnings } from './useTaskEarnings';
import { useHourlyTasks } from './useHourlyTasks';
import { defaultXpFor, computeLevel } from '@/lib/xp';

/**
 * Spočítá XP pro aktuální měsíc:
 * - z task_earnings (mimo hodinové a __bonus): override v task_xp nebo default podle textu
 * - z hodinových úkolů: hours_worked * xp_per_hour
 */
export function useMonthlyXp() {
  const { earnings, loading: earningsLoading } = useTaskEarnings();
  const { tasks: hourlyTasks, loading: hourlyLoading } = useHourlyTasks();
  const [xpMap, setXpMap] = useState<Record<string, number>>({});
  const [xpLoaded, setXpLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.from('task_xp').select('todo_id, xp');
      if (cancelled || !data) return;
      const next: Record<string, number> = {};
      data.forEach((r: any) => { next[r.todo_id] = r.xp; });
      setXpMap(next);
      setXpLoaded(true);
    };
    load();
    const channel = supabase
      .channel(`task-xp-monthly-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_xp' }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  const totalXp = useMemo(() => {
    let sum = 0;
    earnings.forEach(e => {
      const tid = String(e.todo_id);
      if (tid.startsWith('hourly:')) return;
      if (tid.endsWith('__bonus')) return;
      if (xpMap[tid] != null) {
        sum += xpMap[tid];
      } else {
        sum += defaultXpFor(e.todo_text);
      }
    });
    hourlyTasks.forEach(t => {
      const xpPerHour = (t as any).xp_per_hour ?? 10;
      sum += Math.round(Number(t.hours_worked) * xpPerHour);
    });
    return sum;
  }, [earnings, hourlyTasks, xpMap]);

  const levelInfo = useMemo(() => computeLevel(totalXp), [totalXp]);
  const loaded = xpLoaded && !earningsLoading && !hourlyLoading;

  return { totalXp, loaded, ...levelInfo };
}
