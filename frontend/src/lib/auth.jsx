import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession, onUnauthorized, readSession, saveSession } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(() => readSession());

  const logout = useCallback((to = '/') => {
    clearSession();
    setSession(null);
    setUser(null);
    navigate(to);
  }, [navigate]);

  // Al caducar la sesión (24 h) se cierra y se lleva al inicio de sesión (RF-03).
  useEffect(() => {
    onUnauthorized(() => logout('/entrar?caducada=1'));
    if (!session) return undefined;
    const t = setTimeout(() => logout('/entrar?caducada=1'), Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(t);
  }, [session, logout]);

  const refresh = useCallback(async () => {
    if (!readSession()) { setUser(null); return null; }
    try {
      const me = await api('/auth/me');
      setUser(me);
      return me;
    } catch { return null; }
  }, []);

  useEffect(() => { refresh().finally(() => setReady(true)); }, [refresh]);

  const signIn = useCallback((res) => {
    setSession(saveSession(res.token, res.expiresInSeconds));
    setUser(res.user);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, logout, refresh, setUser }), [user, ready, signIn, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
