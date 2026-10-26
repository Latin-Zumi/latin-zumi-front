import { useState, type ReactNode } from 'react';
import { AuthContext } from './auth-context';
import {
  getSession,
  logout as clearSession,
  type Session,
} from '../services/authService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(getSession);

  const startSession = (newSession: Session) => {
    setSession(newSession);
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: session !== null,
        startSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}