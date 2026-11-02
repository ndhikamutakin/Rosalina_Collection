import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());
  const [manualLogout, setManualLogout] = useState(false); // logout manual tidak perlu "kembali ke halaman terakhir"

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Pulihkan sesi saat halaman dibuka ulang: GET /auth/me
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    if (!tokenStore.get()) return;
    api.get('/auth/me')
      .then(setUser)
      .catch(clearSession)
      .finally(() => setLoading(false));
  }, [clearSession]);

  // Sequence Login: POST /auth/login -> simpan token -> simpan profil
  const login = useCallback(async (username, password) => {
    const { token, user: profil } = await api.login(username, password);
    tokenStore.set(token);
    setManualLogout(false);
    setUser(profil);
    return profil;
  }, []);

  const logout = useCallback(async () => {
    setManualLogout(true);
    try { await api.post('/auth/logout'); } catch { /* token stateless, abaikan */ }
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    loading,
    manualLogout,
    login,
    logout,
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin',
  }), [user, loading, manualLogout, login, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
