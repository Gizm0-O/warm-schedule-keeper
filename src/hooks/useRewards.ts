import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RewardsConfig {
  monthlyEarnings: number;
  basePercent: number;
  bonusPerTask: number;
  bonusLate: number;
  maxTasks: number;
  month: string; // "YYYY-MM"
}

export interface TaskBonus {
  todoId: string;
  status: 'pending' | 'on_time' | 'late' | 'missed';
}

const defaultConfig: RewardsConfig = {
  monthlyEarnings: 0,
  basePercent: 10,
  bonusPerTask: 1,
  bonusLate: 0.5,
  maxTasks: 10,
  month: new Date().toISOString().slice(0, 7),
};

export function useRewards(completedTodoIds?: Set<string>) {
  const [config, setConfigState] = useState<RewardsConfig>(defaultConfig);
  const [taskBonuses, setTaskBonusesState] = useState<TaskBonus[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from cloud
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const month = new Date().toISOString().slice(0, 7);

      const [{ data: cfgRow }, { data: bonusRows }] = await Promise.all([
        supabase.from('rewards_config').select('*').eq('month', month).maybeSingle(),
        supabase.from('task_bonuses').select('*'),
      ]);

      if (cancelled) return;

      if (cfgRow) {
        setConfigState({
          monthlyEarnings: Number(cfgRow.monthly_earnings) || 0,
          basePercent: Number(cfgRow.base_percent) || 0,
          bonusPerTask: Number(cfgRow.bonus_per_task) || 0,
          bonusLate: Number(cfgRow.bonus_late) || 0,
          maxTasks: Number(cfgRow.max_tasks) || 0,
          month: cfgRow.month,
        });
      } else {
        setConfigState({ ...defaultConfig, month });
      }

      if (bonusRows) {
        setTaskBonusesState(
          bonusRows.map((r: any) => ({ todoId: r.todo_id, status: r.status as TaskBonus['status'] }))
        );
      }

      setLoaded(true);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Realtime sync across browsers
  useEffect(() => {
    const channel = supabase
      .channel(`rewards-sync-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards_config' }, (payload: any) => {
        const row = payload.new;
        if (!row) return;
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (row.month !== currentMonth) return;
        setConfigState({
          monthlyEarnings: Number(row.monthly_earnings) || 0,
          basePercent: Number(row.base_percent) || 0,
          bonusPerTask: Number(row.bonus_per_task) || 0,
          bonusLate: Number(row.bonus_late) || 0,
          maxTasks: Number(row.max_tasks) || 0,
          month: row.month,
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_bonuses' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old;
          setTaskBonusesState(prev => prev.filter(b => b.todoId !== oldRow.todo_id));
        } else {
          const row = payload.new;
          setTaskBonusesState(prev => {
            const next = prev.filter(b => b.todoId !== row.todo_id);
            return [...next, { todoId: row.todo_id, status: row.status as TaskBonus['status'] }];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const saveConfig = useCallback(async (newConfig: RewardsConfig) => {
    setConfigState(newConfig);
    await supabase
      .from('rewards_config')
      .upsert(
        {
          month: newConfig.month,
          monthly_earnings: newConfig.monthlyEarnings,
          base_percent: newConfig.basePercent,
          bonus_per_task: newConfig.bonusPerTask,
          bonus_late: newConfig.bonusLate,
          max_tasks: newConfig.maxTasks,
        },
        { onConflict: 'month' }
      );
  }, []);

  const setTaskBonus = useCallback(async (todoId: string, status: TaskBonus['status']) => {
    setTaskBonusesState(prev => {
      const next = prev.filter(b => b.todoId !== todoId);
      return [...next, { todoId, status }];
    });
    await supabase
      .from('task_bonuses')
      .upsert({ todo_id: todoId, status }, { onConflict: 'todo_id' });
  }, []);

  const getTaskBonus = useCallback((todoId: string): TaskBonus['status'] => {
    return taskBonuses.find(b => b.todoId === todoId)?.status ?? 'pending';
  }, [taskBonuses]);

  // Bonusy se počítají JEN pro dokončené úkoly
  const { todos } = useTodos();
  const completedIds = useMemo(() => new Set(todos.filter(t => t.completed).map(t => t.id)), [todos]);
  const effectiveBonuses = useMemo(
    () => taskBonuses.filter(b => completedIds.has(b.todoId)),
    [taskBonuses, completedIds]
  );

  // Výpočty
  const completedOnTime = effectiveBonuses.filter(b => b.status === 'on_time').length;
  const completedLate = effectiveBonuses.filter(b => b.status === 'late').length;
  const totalBonusPercent = Math.min(
    completedOnTime * config.bonusPerTask + completedLate * config.bonusLate,
    config.maxTasks * config.bonusPerTask
  );
  const totalPercent = config.basePercent + totalBonusPercent;
  const totalAmount = Math.round(config.monthlyEarnings * totalPercent / 100);
  const baseAmount = Math.round(config.monthlyEarnings * config.basePercent / 100);
  const bonusAmount = totalAmount - baseAmount;

  // Level systém - jen dokončené bonusové úkoly
  const activeTasks = effectiveBonuses.filter(b => b.status === 'on_time' || b.status === 'late').length;
  const level = activeTasks <= 0 ? 0 : activeTasks <= 3 ? 1 : activeTasks <= 6 ? 2 : activeTasks <= 9 ? 3 : 4;
  const levelLabel = ['Začínám 🌱', 'Na cestě ⭐', 'Makám 💪', 'Boss level 💎', 'Legenda 👑'][level];
  const nextLevelAt = [1, 4, 7, 10, 10][level];
  const progressToNext = level >= 4 ? 100 : Math.round((activeTasks - [0,0,4,7,10][level]) / (nextLevelAt - [0,0,4,7,10][level]) * 100);

  return {
    config,
    saveConfig,
    taskBonuses,
    setTaskBonus,
    getTaskBonus,
    loaded,
    totalPercent,
    totalAmount,
    baseAmount,
    bonusAmount,
    completedOnTime,
    completedLate,
    totalBonusPercent,
    level,
    levelLabel,
    activeTasks,
    nextLevelAt,
    progressToNext,
  };
}
