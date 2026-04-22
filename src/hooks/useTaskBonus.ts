import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTaskBonus() {
  const [map, setMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.from('task_bonus_amounts').select('todo_id, amount');
      if (cancelled || !data) return;
      const next: Record<string, number> = {};
      data.forEach((row: any) => { next[row.todo_id] = row.amount; });
      setMap(next);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`task-bonus-amounts-sync-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_bonus_amounts' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old;
          setMap(prev => {
            const next = { ...prev };
            delete next[oldRow.todo_id];
            return next;
          });
        } else {
          const row = payload.new;
          setMap(prev => ({ ...prev, [row.todo_id]: row.amount }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getBonusAmount = useCallback((todoId: string): number => {
    return map[todoId] ?? 0;
  }, [map]);

  const hasBonus = useCallback((todoId: string): boolean => {
    return map[todoId] != null && map[todoId] > 0;
  }, [map]);

  const setBonusAmount = useCallback(async (todoId: string, amount: number) => {
    if (amount > 0) {
      setMap(prev => ({ ...prev, [todoId]: amount }));
      await supabase
        .from('task_bonus_amounts')
        .upsert({ todo_id: todoId, amount }, { onConflict: 'todo_id' });
    } else {
      setMap(prev => {
        const next = { ...prev };
        delete next[todoId];
        return next;
      });
      await supabase.from('task_bonus_amounts').delete().eq('todo_id', todoId);
    }
  }, []);

  return { getBonusAmount, hasBonus, setBonusAmount };
}
