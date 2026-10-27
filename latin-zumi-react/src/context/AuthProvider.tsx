import { useEffect, useState, type ReactNode } from 'react';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { AuthContext } from './auth-context';
import {
  createFirebaseSession,
  getSession,
  isFirebaseSession,
  logout as clearSession,
  type Session,
} from '../services/authService';
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(getSession);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    if (!isFirebaseConfigured()) return;

    queueMicrotask(() => {
      if (!active) return;

      try {
        unsubscribe = onIdTokenChanged(
          getFirebaseAuth(),
          (firebaseUser) => {
            if (!active) return;

            if (!firebaseUser) {
              setSession((current) =>
                current && isFirebaseSession(current) ? null : current,
              );
              setIsLoading(false);
              return;
            }

            clearSession();
            void createFirebaseSession(firebaseUser)
              .then((firebaseSession) => {
                if (!active) return;
                setSession(firebaseSession);
              })
              .catch((error: unknown) => {
                console.error('No se pudo restaurar la sesión de Firebase.', error);
              })
              .finally(() => {
                if (active) setIsLoading(false);
              });
          },
          (error) => {
            if (!active) return;
            console.error('No se pudo observar la sesión de Firebase.', error);
            setIsLoading(false);
          },
        );
      } catch (error) {
        console.error('No se pudo inicializar Firebase Authentication.', error);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const startSession = (newSession: Session) => {
    if (isFirebaseSession(newSession)) {
      clearSession();
    }
    setSession(newSession);
  };

  const logout = async () => {
    if (session && isFirebaseSession(session)) {
      await signOut(getFirebaseAuth());
    }
    clearSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: session !== null,
        isLoading,
        startSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}