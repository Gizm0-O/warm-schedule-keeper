import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultXpFor } from '@/lib/xp';

export function useTaskXp() {
  const [map, setMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.from('task_xp').select('todo_id, xp');
      if (cancelled || !data) return;
      const next: Record<string, number> = {};
      data.forEach((row: any) => { next[row.todo_id] = row.xp; });
      setMap(next);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`task-xp-sync-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_xp' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old;
          setMap(prev => {
            const next = { ...prev };
            delete next[oldRow.todo_id];
            return next;
          });
        } else {
          const row = payload.new;
          setMap(prev => ({ ...prev, [row.todo_id]: row.xp }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Vrátí explicitní override, nebo undefined (bez defaultu)
  const getXpOverride = useCallback((todoId: string): number | undefined => {
    return map[todoId];
  }, [map]);

  // Vrátí XP pro úkol – override nebo default podle textu
  const getXpFor = useCallback((todoId: string, todoText?: string | null): number => {
    if (map[todoId] != null) return map[todoId];
    return defaultXpFor(todoText);
  }, [map]);

  const setXp = useCallback(async (todoId: string, xp: number) => {
    if (xp > 0) {
      setMap(prev => ({ ...prev, [todoId]: xp }));
      await supabase.from('task_xp').upsert({ todo_id: todoId, xp }, { onConflict: 'todo_id' });
    } else {
      setMap(prev => {
        const next = { ...prev };
        delete next[todoId];
        return next;
      });
      await supabase.from('task_xp').delete().eq('todo_id', todoId);
    }
  }, []);

  return { map, getXpOverride, getXpFor, setXp };
}
