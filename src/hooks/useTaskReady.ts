import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTaskReady() {
  const [map, setMap] = useState<Record<string, boolean>>({});

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.from('task_ready').select('todo_id');
      if (cancelled || !data) return;
      const next: Record<string, boolean> = {};
      data.forEach((row: any) => { next[row.todo_id] = true; });
      setMap(next);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Realtime sync across browsers/devices
  useEffect(() => {
    const channel = supabase
      .channel(`task-ready-sync-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_ready' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old;
          setMap(prev => {
            const next = { ...prev };
            delete next[oldRow.todo_id];
            return next;
          });
        } else {
          const row = payload.new;
          setMap(prev => ({ ...prev, [row.todo_id]: true }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const isReady = useCallback((todoId: string): boolean => {
    return !!map[todoId];
  }, [map]);

  const setReady = useCallback(async (todoId: string, ready: boolean) => {
    // Optimistic update
    setMap(prev => {
      const next = { ...prev };
      if (ready) next[todoId] = true;
      else delete next[todoId];
      return next;
    });

    if (ready) {
      await supabase
        .from('task_ready')
        .upsert({ todo_id: todoId }, { onConflict: 'todo_id' });
    } else {
      await supabase.from('task_ready').delete().eq('todo_id', todoId);
    }
  }, []);

  return { isReady, setReady };
}
