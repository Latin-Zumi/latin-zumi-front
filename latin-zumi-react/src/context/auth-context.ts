import { createContext } from 'react';
import type { AuthUser, Session } from '../services/authService';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  startSession: (session: Session) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
