import { createContext } from 'react';
import type { AuthUser, Session } from '../../services/authService';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  // Contraseña vieja: el back no deja operar hasta cambiarla
  passwordChangeRequired: boolean;
  startSession: (session: Session) => void;
  updateUser: (user: AuthUser) => void;
  completePasswordChange: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
