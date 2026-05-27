import { useEffect, useState, useCallback } from 'react';
import * as api from './api.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return api.getStatus().then(
      (u) => setUser(u),
      () => setUser(null),
    );
  }, []);

  useEffect(() => {
    let alive = true;
    api.getStatus().then(
      (u) => alive && setUser(u),
      () => alive && setUser(null),
    ).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (id, pw) => {
    const u = await api.signin(id, pw);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.signout();
    setUser(null);
  }, []);

  return { user, loading, login, logout, refresh };
}
