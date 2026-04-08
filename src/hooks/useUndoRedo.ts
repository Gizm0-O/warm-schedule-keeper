import { useState, useCallback, useEffect, useRef } from "react";

export interface UndoAction {
  undo: () => any | Promise<any>;
  redo: () => any | Promise<any>;
}

export function useUndoRedo() {
  const pastRef = useRef<UndoAction[]>([]);
  const futureRef = useRef<UndoAction[]>([]);
  const [, forceRender] = useState(0);

  const rerender = () => forceRender((n) => n + 1);

  const pushAction = useCallback((action: UndoAction) => {
    pastRef.current = [...pastRef.current.slice(-49), action];
    futureRef.current = [];
    rerender();
  }, []);

  const undo = useCallback(async () => {
    if (pastRef.current.length === 0) return;
    const action = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, action];
    rerender();
    await action.undo();
  }, []);

  const redo = useCallback(async () => {
    if (futureRef.current.length === 0) return;
    const action = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, action];
    rerender();
    await action.redo();
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

  return {
    pushAction,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
