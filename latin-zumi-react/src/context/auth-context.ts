import { createContext } from 'react';
import type { AuthUser, Session } from '../services/authService';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  startSession: (session: Session) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);