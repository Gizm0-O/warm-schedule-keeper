import { useState, useEffect } from 'react';

const STORAGE_KEY = 'adminModePersist';
const SESSION_KEY = 'adminMode';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function readPersisted(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw) as { expiresAt: number };
    if (typeof expiresAt !== 'number' || Date.now() > expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isAdminNow(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1' || readPersisted();
}

export function enableAdminMode(persistDays = 30) {
  sessionStorage.setItem(SESSION_KEY, '1');
  const expiresAt = Date.now() + persistDays * 24 * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiresAt }));
  window.dispatchEvent(new Event('adminModeChanged'));
}

export function disableAdminMode() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('adminModeChanged'));
}

export function useAdminMode(): boolean {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminNow());

  useEffect(() => {
    // Promote persisted -> session on mount so other code paths still work
    if (!sessionStorage.getItem(SESSION_KEY) && readPersisted()) {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    const handler = () => setIsAdmin(isAdminNow());
    window.addEventListener('adminModeChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('adminModeChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return isAdmin;
}

// Suppress unused export warning from THIRTY_DAYS_MS in case tree-shaken
void THIRTY_DAYS_MS;
