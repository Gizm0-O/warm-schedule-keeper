import { useState, useEffect } from 'react';

const STORAGE_KEY = 'adminModePersist';
const SESSION_KEY = 'adminMode';

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

function isAdminToggleOn(): boolean {
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

/**
 * Returns true only if the user has admin role AND has the admin toggle on.
 * Without admin role, always returns false regardless of stored toggle state.
 */
export function useAdminMode(): boolean {
  const [toggleOn, setToggleOn] = useState<boolean>(() => isAdminToggleOn());
  const [hasRole, setHasRole] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    // lazy import to avoid circular deps at module load
    import('@/integrations/supabase/client').then(({ supabase }) => {
      const check = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { if (alive) setHasRole(false); return; }
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
        if (alive) setHasRole(!!data);
      };
      check();
      const { data: sub } = supabase.auth.onAuthStateChange(() => setTimeout(() => check(), 0));
      return () => sub.subscription.unsubscribe();
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const handler = () => setToggleOn(isAdminToggleOn());
    window.addEventListener('adminModeChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('adminModeChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return hasRole && toggleOn;
}

/** Whether the current user has the admin role (regardless of toggle). */
export function useHasAdminRole(): boolean {
  const [hasRole, setHasRole] = useState(false);
  useEffect(() => {
    let alive = true;
    import('@/integrations/supabase/client').then(({ supabase }) => {
      const check = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { if (alive) setHasRole(false); return; }
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
        if (alive) setHasRole(!!data);
      };
      check();
      const { data: sub } = supabase.auth.onAuthStateChange(() => setTimeout(() => check(), 0));
      return () => sub.subscription.unsubscribe();
    });
    return () => { alive = false; };
  }, []);
  return hasRole;
}
