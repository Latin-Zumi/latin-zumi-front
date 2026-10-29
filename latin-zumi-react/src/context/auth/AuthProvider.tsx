import { useCallback, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import {
  getSession,
  logout as logoutService,
  saveSession,
  type AuthUser,
  type Session,
} from '../../services/authService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(getSession);

  const startSession = (newSession: Session) => {
    setSession(newSession);
  };

  const updateUser = (user: AuthUser) => {
    if (!session) return;
    const updated = { ...session, user };
    saveSession(updated);
    setSession(updated);
  };

  // Estable para no volver a disparar efectos que dependen de ella
  const logout = useCallback(async () => {
    await logoutService();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: session !== null,
        startSession,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
