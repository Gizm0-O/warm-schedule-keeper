import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TASK_EARNINGS_CHANGED_EVENT = 'task-earnings-changed';

const emitTaskEarningsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASK_EARNINGS_CHANGED_EVENT));
  }
};

export interface TaskEarning {
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

export function useTaskEarnings() {
  const [earnings, setEarnings] = useState<TaskEarning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    const { data } = await supabase
      .from('task_earnings')
      .select('*')
      .order('completed_at', { ascending: false });
    if (data) setEarnings(data as TaskEarning[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEarnings();

    const handleChange = () => {
      fetchEarnings();
    };

    window.addEventListener(TASK_EARNINGS_CHANGED_EVENT, handleChange);
    return () => {
      window.removeEventListener(TASK_EARNINGS_CHANGED_EVENT, handleChange);
    };
  }, [fetchEarnings]);

  const addEarning = useCallback(async (earning: Omit<TaskEarning, 'id' | 'created_at'>) => {
    const { data } = await supabase
      .from('task_earnings')
      .insert({
        todo_id: earning.todo_id,
        todo_text: earning.todo_text,
        amount: earning.amount,
        bonus_type: earning.bonus_type,
        bonus_percent: earning.bonus_percent,
        deadline: earning.deadline,
        completed_at: earning.completed_at,
      })
      .select()
      .single();
    if (data) {
      setEarnings(prev => [data as TaskEarning, ...prev]);
      emitTaskEarningsChanged();
      return data as TaskEarning;
    }
    return null;
  }, []);

  const removeEarning = useCallback(async (id: string) => {
    await supabase.from('task_earnings').delete().eq('id', id);
    setEarnings(prev => prev.filter(e => e.id !== id));
    emitTaskEarningsChanged();
  }, []);

  const updateEarning = useCallback(async (id: string, updates: Partial<Pick<TaskEarning, 'amount' | 'bonus_type' | 'bonus_percent' | 'todo_text'>>) => {
    await supabase.from('task_earnings').update(updates).eq('id', id);
    setEarnings(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    emitTaskEarningsChanged();
  }, []);

  const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);

  return { earnings, loading, addEarning, removeEarning, updateEarning, totalEarned, refetch: fetchEarnings };
}
