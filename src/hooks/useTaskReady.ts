import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'task_ready_map';

function loadMap(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('taskReadyChanged'));
}

export function useTaskReady() {
  const [map, setMap] = useState<Record<string, boolean>>(loadMap);

  useEffect(() => {
    const handler = () => setMap(loadMap());
    window.addEventListener('taskReadyChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('taskReadyChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const isReady = useCallback((todoId: string): boolean => {
    return !!map[todoId];
  }, [map]);

  const setReady = useCallback((todoId: string, ready: boolean) => {
    setMap(prev => {
      const next = { ...prev };
      if (ready) next[todoId] = true;
      else delete next[todoId];
      saveMap(next);
      return next;
    });
  }, []);

  return { isReady, setReady };
}
