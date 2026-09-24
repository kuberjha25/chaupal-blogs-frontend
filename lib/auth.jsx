import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null); // { token, user, permissions }
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ctc-auth');
      if (raw) setAuth(JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    try {
      localStorage.setItem('ctc-auth', JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
    setAuth(data);
    return data;
  };

  const logout = () => {
    try {
      localStorage.removeItem('ctc-auth');
    } catch (e) {
      /* ignore */
    }
    setAuth(null);
  };

  /* can('publish') ya can('edit-content,edit-meta') — koi ek match kaafi */
  const can = (perms) => {
    if (!auth || !auth.permissions) return false;
    return String(perms)
      .split(',')
      .some((p) => auth.permissions.includes(p.trim()));
  };

  return (
    <AuthCtx.Provider value={{ user: auth ? auth.user : null, permissions: auth ? auth.permissions : [], ready, login, logout, can }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
