import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ArchivedEarning {
  id: string;
  todo_id: string;
  todo_text: string;
  amount: number;
  bonus_type: string | null;
  bonus_percent: number | null;
  deadline: string | null;
  completed_at: string;
  created_at: string;
}

export interface ArchivedBonus {
  id: string;
  todo_id: string;
  status: string;
}

export interface ArchivedConfig {
  monthlyEarnings: number;
  basePercent: number;
  bonusPerTask: number;
  bonusLate: number;
  maxTasks: number;
  month: string;
}

export interface ArchivedHourlyTask {
  id: string;
  name: string;
  rate_per_hour: number;
  milestone_hours: number;
  milestone_bonus_percent: number;
  hours_worked: number;
  color: string;
  person: string;
}

export interface MonthlyArchive {
  id: string;
  month: string;
  total_earned: number;
  allowance_amount: number;
  base_amount: number;
  bonus_amount: number;
  to_hand_over: number;
  total_percent: number;
  total_bonus_percent: number;
  completed_on_time: number;
  completed_late: number;
  completed_missed: number;
  total_xp: number;
  earnings_snapshot: ArchivedEarning[];
  bonuses_snapshot: ArchivedBonus[];
  config_snapshot: ArchivedConfig;
  hourly_tasks_snapshot: ArchivedHourlyTask[];
  closed_at: string;
  updated_at: string;
}

const ARCHIVE_CHANGED = 'monthly-archive-changed';
const emit = () => window.dispatchEvent(new CustomEvent(ARCHIVE_CHANGED));

/** Vrací seznam dostupných měsíců (např. ["2025-10","2025-09"]) seřazený sestupně. */
export function useArchivedMonths() {
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonths = useCallback(async () => {
    const { data } = await supabase
      .from('monthly_archives')
      .select('month')
      .order('month', { ascending: false });
    if (data) setMonths(data.map(r => r.month as string));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMonths();
    const handler = () => fetchMonths();
    window.addEventListener(ARCHIVE_CHANGED, handler);
    return () => window.removeEventListener(ARCHIVE_CHANGED, handler);
  }, [fetchMonths]);

  return { months, loading, refetch: fetchMonths };
}

/** Načte celý snapshot konkrétního měsíce. */
export function useMonthlyArchive(month: string | null) {
  const [archive, setArchive] = useState<MonthlyArchive | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchArchive = useCallback(async () => {
    if (!month) { setArchive(null); return; }
    setLoading(true);
    const { data } = await supabase
      .from('monthly_archives')
      .select('*')
      .eq('month', month)
      .maybeSingle();
    if (data) setArchive(data as unknown as MonthlyArchive);
    else setArchive(null);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchArchive();
    const handler = () => fetchArchive();
    window.addEventListener(ARCHIVE_CHANGED, handler);
    return () => window.removeEventListener(ARCHIVE_CHANGED, handler);
  }, [fetchArchive]);

  /** Přepočítá souhrnná čísla ze snapshotu earnings + config a uloží zpět. */
  const recalcAndSave = useCallback(async (next: MonthlyArchive) => {
    const earnings = next.earnings_snapshot || [];
    const cfg = next.config_snapshot || { monthlyEarnings: 0, basePercent: 0, bonusPerTask: 0, bonusLate: 0, maxTasks: 10, month: next.month };
    const taskEarnings = earnings.filter(e => !String(e.todo_id).endsWith('__bonus'));
    // Vyděláno zahrnuje i bonusové odměny (__bonus)
    const totalEarned = earnings.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const completedOnTime = taskEarnings.filter(e => e.bonus_type === 'on_time').length;
    const completedLate = taskEarnings.filter(e => e.bonus_type === 'late').length;
    const completedMissed = taskEarnings.filter(e => e.bonus_type === 'missed').length;
    const rawBonusPercent = taskEarnings.reduce((sum, e) => {
      if (e.bonus_type === 'on_time') return sum + (e.bonus_percent != null ? Number(e.bonus_percent) : cfg.bonusPerTask);
      if (e.bonus_type === 'late') return sum + (e.bonus_percent != null ? Number(e.bonus_percent) : cfg.bonusLate);
      return sum;
    }, 0);
    const totalBonusPercent = Math.min(rawBonusPercent, cfg.maxTasks * cfg.bonusPerTask);
    const totalPercent = cfg.basePercent + totalBonusPercent;
    const allowanceAmount = Math.round(totalEarned * totalPercent / 100);
    const baseAmount = Math.round(totalEarned * cfg.basePercent / 100);
    const bonusAmount = allowanceAmount - baseAmount;
    const toHandOver = totalEarned - allowanceAmount;

    const updates = {
      earnings_snapshot: next.earnings_snapshot,
      bonuses_snapshot: next.bonuses_snapshot,
      config_snapshot: next.config_snapshot,
      hourly_tasks_snapshot: next.hourly_tasks_snapshot,
      total_earned: totalEarned,
      allowance_amount: allowanceAmount,
      base_amount: baseAmount,
      bonus_amount: bonusAmount,
      to_hand_over: toHandOver,
      total_percent: totalPercent,
      total_bonus_percent: totalBonusPercent,
      completed_on_time: completedOnTime,
      completed_late: completedLate,
      completed_missed: completedMissed,
    };

    await supabase.from('monthly_archives').update(updates as any).eq('id', next.id);
    setArchive({ ...next, ...updates });
    emit();
  }, []);

  const updateEarning = useCallback(async (earningId: string, patch: Partial<ArchivedEarning>) => {
    if (!archive) return;
    const next = {
      ...archive,
      earnings_snapshot: archive.earnings_snapshot.map(e => e.id === earningId ? { ...e, ...patch } : e),
    };
    await recalcAndSave(next);
  }, [archive, recalcAndSave]);

  const removeEarning = useCallback(async (earningId: string) => {
    if (!archive) return;
    const next = {
      ...archive,
      earnings_snapshot: archive.earnings_snapshot.filter(e => e.id !== earningId),
    };
    await recalcAndSave(next);
  }, [archive, recalcAndSave]);

  const updateConfig = useCallback(async (patch: Partial<ArchivedConfig>) => {
    if (!archive) return;
    const next = {
      ...archive,
      config_snapshot: { ...archive.config_snapshot, ...patch },
    };
    await recalcAndSave(next);
  }, [archive, recalcAndSave]);

  const addEarning = useCallback(async (earning: Omit<ArchivedEarning, 'id' | 'created_at'>) => {
    if (!archive) return;
    // Default completed_at to last day of the archived month at noon if not provided
    let completedAt = earning.completed_at;
    if (!completedAt) {
      const [y, m] = archive.month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      completedAt = new Date(y, m - 1, lastDay, 12, 0, 0).toISOString();
    }
    const newEarning: ArchivedEarning = {
      id: (crypto as any).randomUUID ? crypto.randomUUID() : `manual-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      todo_id: earning.todo_id || `manual-${Date.now()}`,
      todo_text: earning.todo_text,
      amount: earning.amount,
      bonus_type: earning.bonus_type ?? null,
      bonus_percent: earning.bonus_percent ?? null,
      deadline: earning.deadline ?? null,
      completed_at: completedAt,
      created_at: new Date().toISOString(),
    };
    const next = {
      ...archive,
      earnings_snapshot: [newEarning, ...(archive.earnings_snapshot || [])],
    };
    await recalcAndSave(next);
  }, [archive, recalcAndSave]);

  return { archive, loading, refetch: fetchArchive, updateEarning, removeEarning, updateConfig, addEarning };
}

/**
 * Při prvním otevření v novém měsíci automaticky archivuje předchozí měsíce
 * a smaže jejich originály z task_earnings, task_bonuses, hourly_tasks.
 */
export function useMonthlyAutoArchive() {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // 1) Najdi všechny měsíce, které ještě nejsou archivované a obsahují data starší než tento měsíc
      const [{ data: earningsRows }, { data: hourlyRows }] = await Promise.all([
        supabase.from('task_earnings').select('id, todo_id, todo_text, amount, bonus_type, bonus_percent, deadline, completed_at, created_at'),
        supabase.from('hourly_tasks').select('*'),
      ]);

      if (cancelled) return;

      // Group earnings by month (z completed_at)
      const byMonth = new Map<string, any[]>();
      (earningsRows || []).forEach(r => {
        const m = String(r.completed_at).slice(0, 7);
        if (m && m < currentMonth) {
          if (!byMonth.has(m)) byMonth.set(m, []);
          byMonth.get(m)!.push(r);
        }
      });

      // Group hourly tasks by month
      const hourlyByMonth = new Map<string, any[]>();
      (hourlyRows || []).forEach(r => {
        const m = String(r.month);
        if (m && m < currentMonth) {
          if (!hourlyByMonth.has(m)) hourlyByMonth.set(m, []);
          hourlyByMonth.get(m)!.push(r);
        }
      });

      const allMonths = new Set<string>([...byMonth.keys(), ...hourlyByMonth.keys()]);
      if (allMonths.size === 0) return;

      for (const month of allMonths) {
        // Pokud už existuje archiv, přeskoč
        const { data: existing } = await supabase
          .from('monthly_archives')
          .select('id')
          .eq('month', month)
          .maybeSingle();
        if (existing) continue;

        // Načti config pro tento měsíc
        const { data: cfgRow } = await supabase
          .from('rewards_config')
          .select('*')
          .eq('month', month)
          .maybeSingle();

        const cfg = cfgRow ? {
          monthlyEarnings: Number(cfgRow.monthly_earnings) || 0,
          basePercent: Number(cfgRow.base_percent) || 0,
          bonusPerTask: Number(cfgRow.bonus_per_task) || 0,
          bonusLate: Number(cfgRow.bonus_late) || 0,
          maxTasks: Number(cfgRow.max_tasks) || 10,
          month,
        } : { monthlyEarnings: 0, basePercent: 5, bonusPerTask: 1, bonusLate: 0.5, maxTasks: 10, month };

        // Načti všechny task_bonuses (nejsou per month, ale aspoň snapshot)
        const { data: bonusRows } = await supabase.from('task_bonuses').select('*');

        const earnings = byMonth.get(month) || [];
        const hourlyTasks = hourlyByMonth.get(month) || [];

        // Spočítej souhrny
        const taskEarnings = earnings.filter(e => !String(e.todo_id).endsWith('__bonus'));
        // Vyděláno zahrnuje i bonusové odměny (__bonus)
        const totalEarned = earnings.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const completedOnTime = taskEarnings.filter(e => e.bonus_type === 'on_time').length;
        const completedLate = taskEarnings.filter(e => e.bonus_type === 'late').length;
        const completedMissed = taskEarnings.filter(e => e.bonus_type === 'missed').length;
        const rawBonusPercent = taskEarnings.reduce((sum, e) => {
          if (e.bonus_type === 'on_time') return sum + (e.bonus_percent != null ? Number(e.bonus_percent) : cfg.bonusPerTask);
          if (e.bonus_type === 'late') return sum + (e.bonus_percent != null ? Number(e.bonus_percent) : cfg.bonusLate);
          return sum;
        }, 0);
        const totalBonusPercent = Math.min(rawBonusPercent, cfg.maxTasks * cfg.bonusPerTask);
        const totalPercent = cfg.basePercent + totalBonusPercent;
        const allowanceAmount = Math.round(totalEarned * totalPercent / 100);
        const baseAmount = Math.round(totalEarned * cfg.basePercent / 100);
        const bonusAmount = allowanceAmount - baseAmount;
        const toHandOver = totalEarned - allowanceAmount;

        // Vytvoř archive řádek
        const { error: insertErr } = await supabase.from('monthly_archives').insert({
          month,
          total_earned: totalEarned,
          allowance_amount: allowanceAmount,
          base_amount: baseAmount,
          bonus_amount: bonusAmount,
          to_hand_over: toHandOver,
          total_percent: totalPercent,
          total_bonus_percent: totalBonusPercent,
          completed_on_time: completedOnTime,
          completed_late: completedLate,
          completed_missed: completedMissed,
          earnings_snapshot: earnings as any,
          bonuses_snapshot: (bonusRows || []) as any,
          config_snapshot: cfg as any,
          hourly_tasks_snapshot: hourlyTasks as any,
        });

        if (insertErr) {
          console.error('[monthly-archive] insert failed for', month, insertErr);
          continue;
        }

        // Smaž originály patřící tomuto měsíci
        const earningIds = earnings.map(e => e.id);
        if (earningIds.length > 0) {
          await supabase.from('task_earnings').delete().in('id', earningIds);
        }
        const hourlyIds = hourlyTasks.map(h => h.id);
        if (hourlyIds.length > 0) {
          await supabase.from('hourly_tasks').delete().in('id', hourlyIds);
        }

        console.log('[monthly-archive] archived month', month, '— earnings:', earnings.length, 'hourly:', hourlyTasks.length);
      }

      // Notify
      window.dispatchEvent(new CustomEvent('task-earnings-changed'));
      window.dispatchEvent(new CustomEvent('hourly-tasks-changed'));
      emit();
    };
    run();
  }, []);
}
