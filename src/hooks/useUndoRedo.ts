import { useState, useCallback, useEffect } from "react";

export interface UndoAction {
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

export function useUndoRedo() {
  const [past, setPast] = useState<UndoAction[]>([]);
  const [future, setFuture] = useState<UndoAction[]>([]);

  const pushAction = useCallback((action: UndoAction) => {
    setPast((prev) => [...prev.slice(-49), action]);
    setFuture([]);
  }, []);

  const undo = useCallback(async () => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const action = prev[prev.length - 1];
      action.undo();
      setFuture((f) => [...f, action]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(async () => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const action = prev[prev.length - 1];
      action.redo();
      setPast((p) => [...p, action]);
      return prev.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return { pushAction, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
