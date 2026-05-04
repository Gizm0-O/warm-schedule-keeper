import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HourlyTask {
  id: string;
  name: string;
  rate_per_hour: number;
  milestone_hours: number;
  milestone_bonus_percent: number;
  hours_worked: number;
  month: string;
  color: string;
  person: string;
  created_at: string;
  updated_at: string;
}

const HOURLY_TASKS_CHANGED = 'hourly-tasks-changed';
const emit = () => window.dispatchEvent(new CustomEvent(HOURLY_TASKS_CHANGED));

const currentMonth = () => new Date().toISOString().slice(0, 7);

export function useHourlyTasks() {
  const [tasks, setTasks] = useState<HourlyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const month = currentMonth();
    let { data } = await supabase
      .from('hourly_tasks')
      .select('*')
      .eq('month', month)
      .order('created_at', { ascending: true });

    // Pokud v aktuálním měsíci nejsou žádné hodinové úkoly,
    // zkus je obnovit (resetované) z posledního archivu.
    if (!data || data.length === 0) {
      const { data: lastArchive } = await supabase
        .from('monthly_archives')
        .select('month, hourly_tasks_snapshot')
        .lt('month', month)
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle();
      const snapshot = (lastArchive?.hourly_tasks_snapshot as any[]) || [];
      if (snapshot.length > 0) {
        const rows = snapshot.map((t: any) => ({
          name: t.name,
          rate_per_hour: t.rate_per_hour ?? 250,
          milestone_hours: t.milestone_hours ?? 5,
          milestone_bonus_percent: t.milestone_bonus_percent ?? 0.5,
          color: t.color ?? 'hsl(var(--primary))',
          person: t.person ?? 'Tadeáš',
          month,
          hours_worked: 0,
        }));
        const { data: inserted } = await supabase
          .from('hourly_tasks')
          .insert(rows)
          .select();
        data = inserted || [];
      }
    }

    if (data) setTasks(data as HourlyTask[]);
    setLoading(false);
  }, []);


  useEffect(() => {
    fetchTasks();
    const handler = () => fetchTasks();
    window.addEventListener(HOURLY_TASKS_CHANGED, handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener(HOURLY_TASKS_CHANGED, handler);
      window.removeEventListener('focus', handler);
    };
  }, [fetchTasks]);

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel(`hourly-tasks-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hourly_tasks' }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const createTask = useCallback(async (input: {
    name: string;
    rate_per_hour?: number;
    milestone_hours?: number;
    milestone_bonus_percent?: number;
    color?: string;
    person?: string;
  }) => {
    const { data } = await supabase
      .from('hourly_tasks')
      .insert({
        name: input.name,
        rate_per_hour: input.rate_per_hour ?? 250,
        milestone_hours: input.milestone_hours ?? 5,
        milestone_bonus_percent: input.milestone_bonus_percent ?? 0.5,
        color: input.color ?? 'hsl(var(--primary))',
        person: input.person ?? 'Tadeáš',
        month: currentMonth(),
      })
      .select()
      .single();
    if (data) {
      setTasks(prev => [...prev, data as HourlyTask]);
      emit();
    }
    return data as HourlyTask | null;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<HourlyTask>) => {
    await supabase.from('hourly_tasks').update(updates).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    emit();
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('hourly_tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
    emit();
  }, []);

  /**
   * Změní hodiny o delta (např. +1 nebo -1).
   * Synchronizuje task_earnings:
   *  - Každá hodina = jeden řádek v task_earnings (rate_per_hour Kč)
   *  - Každý dosažený milník (5h) = jeden bonusový řádek (0 Kč, jen bonus_percent)
   * Při snižování se odpovídající řádky odeberou.
   */
  const adjustHours = useCallback(async (task: HourlyTask, delta: number) => {
    const newHours = Math.max(0, task.hours_worked + delta);
    if (newHours === task.hours_worked) return;

    // 1) Update v DB
    await supabase.from('hourly_tasks').update({ hours_worked: newHours }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, hours_worked: newHours } : t));

    // 2) Sync task_earnings - smaž všechny existující earningy pro tento hourly task v aktuálním měsíci
    const todoIdHourPrefix = `hourly:${task.id}:hour:`;
    const todoIdBonusPrefix = `hourly:${task.id}:bonus:`;

    await supabase.from('task_earnings').delete().like('todo_id', `hourly:${task.id}:%`);

    // 3) Vytvoř nové earningy pro každou hodinu
    const rows: any[] = [];
    for (let h = 1; h <= newHours; h++) {
      rows.push({
        todo_id: `${todoIdHourPrefix}${h}`,
        todo_text: `${task.name} – hodina ${h}`,
        amount: task.rate_per_hour,
        bonus_type: null,
        bonus_percent: null,
        deadline: null,
        completed_at: new Date().toISOString(),
      });
    }
    // Bonusy za dosažené milníky
    const milestonesReached = Math.floor(newHours / task.milestone_hours);
    for (let m = 1; m <= milestonesReached; m++) {
      rows.push({
        todo_id: `${todoIdBonusPrefix}${m}`,
        todo_text: `${task.name} – bonus za ${m * task.milestone_hours}h`,
        amount: 0,
        bonus_type: 'on_time',
        bonus_percent: task.milestone_bonus_percent,
        deadline: null,
        completed_at: new Date().toISOString(),
      });
    }

    if (rows.length > 0) {
      await supabase.from('task_earnings').insert(rows);
    }

    // Notify ostatní (RewardsBanner, totalEarned, atd.)
    window.dispatchEvent(new CustomEvent('task-earnings-changed'));
    emit();
  }, []);

  return { tasks, loading, createTask, updateTask, deleteTask, adjustHours, refetch: fetchTasks };
}
