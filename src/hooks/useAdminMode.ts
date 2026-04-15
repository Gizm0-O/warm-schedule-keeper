import { useState, useEffect } from 'react';

export function useAdminMode(): boolean {
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => sessionStorage.getItem('adminMode') === '1'
  );

  useEffect(() => {
    const handler = () => {
      setIsAdmin(sessionStorage.getItem('adminMode') === '1');
    };
    window.addEventListener('adminModeChanged', handler);
    return () => window.removeEventListener('adminModeChanged', handler);
  }, []);

  return isAdmin;
}
