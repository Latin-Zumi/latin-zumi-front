import { ApiConnectionError, postJson } from './apiClient';
import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { FirebaseConfigurationError, getFirebaseAuth } from './firebase';
import {
  findOrCreateMockGoogleUser,
  loginMockUser,
  registerMockUser,
} from '../mocks/users';

const STORAGE_KEY = 'latin-zumi:session';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  nombre: string;
  pais: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  pais: string | null; // null hasta que un usuario de Google completa su perfil
  moneda_preferida: string;
  roles: string[];
  estado: string;
  foto_url?: string | null;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export class AuthError extends Error {}

// La función existe en la app pero el backend todavía no la ofrece
export class AuthUnavailableError extends AuthError {}

export function isProfileComplete(user: AuthUser): boolean {
  return Boolean(user.pais && user.nombre.trim());
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage no disponible: la sesión queda solo en memoria
  }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<Session>;
    // Descarta sesiones viejas que no vienen del backend (por ejemplo, las de Firebase)
    if (!session.token || !Array.isArray(session.user?.roles)) return null;
    return session as Session;
  } catch {
    return null;
  }
}

async function requestSession(
  path: string,
  body: unknown,
  errorFor: (status: number) => AuthError,
): Promise<Session> {
  let response: Response;
  try {
    response = await postJson(path, body);
  } catch (error) {
    if (error instanceof ApiConnectionError) {
      throw new AuthError('No pudimos conectar con el servidor. Probá de nuevo.');
    }
    throw error;
  }

  if (!response.ok) throw errorFor(response.status);

  const data = (await response.json()) as Session;
  const session: Session = { token: data.token, user: data.user };
  saveSession(session);
  return session;
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function startMockSession(user: AuthUser): Session {
  const session: Session = { token: `mock-${user.id}`, user };
  saveSession(session);
  return session;
}

export async function login(credentials: LoginCredentials): Promise<Session> {
  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    const user = loginMockUser(credentials.email, credentials.password);
    if (!user) throw new AuthError('Email o contraseña incorrectos');
    return startMockSession(user);
  }

  return requestSession('/auth/login', credentials, (status) =>
    new AuthError(
      status === 401
        ? 'Email o contraseña incorrectos'
        : 'No pudimos iniciar sesión. Probá de nuevo.',
    ),
  );
}

export async function register(data: RegisterData): Promise<Session> {
  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    const user = registerMockUser(data);
    if (!user) throw new AuthError('Ya existe una cuenta con ese email.');
    return startMockSession(user);
  }

  return requestSession('/auth/register', data, (status) =>
    new AuthError(
      status === 409
        ? 'Ya existe una cuenta con ese email.'
        : 'No pudimos crear la cuenta. Probá de nuevo.',
    ),
  );
}

const googleSignInMessages: Record<string, string> = {
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con este email. Ingresá con el método que usaste al registrarte.',
  'auth/network-request-failed':
    'No pudimos conectar con Google. Revisá tu conexión e intentá de nuevo.',
  'auth/operation-not-allowed':
    'El inicio de sesión con Google no está habilitado en Firebase.',
  'auth/popup-blocked':
    'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes e intentá de nuevo.',
  'auth/unauthorized-domain':
    'Este dominio no está autorizado para iniciar sesión con Google.',
  'auth/too-many-requests':
    'Hubo demasiados intentos. Esperá un momento e intentá de nuevo.',
};

function googleBackendError(status: number): AuthError {
  if (status === 404 || status === 405 || status === 501) {
    return new AuthUnavailableError(
      'El ingreso con Google todavía no está disponible. Mientras tanto, usá tu email y contraseña.',
    );
  }
  if (status === 401) {
    return new AuthError('Google no pudo confirmar tu identidad. Probá de nuevo.');
  }
  if (status === 409) {
    return new AuthError(
      'Ya existe una cuenta con este email. Ingresá con tu email y contraseña.',
    );
  }
  return new AuthError('No pudimos iniciar sesión con Google. Probá de nuevo.');
}

// Google identifica al usuario; el backend lo crea o lo vincula y devuelve su propia sesión
export async function loginWithGoogle(): Promise<Session | null> {
  try {
    const auth = getFirebaseAuth();
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());

    try {
      if (USE_MOCK) {
        return startMockSession(
          findOrCreateMockGoogleUser({
            email: user.email ?? `${user.uid}@google.mock`,
            nombre: user.displayName ?? '',
            foto_url: user.photoURL,
          }),
        );
      }

      const idToken = await user.getIdToken();
      return await requestSession('/auth/google', { idToken }, googleBackendError);
    } finally {
      // La sesión de Firebase solo sirve para el intercambio
      await signOut(auth).catch(() => undefined);
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;

    if (error instanceof FirebaseConfigurationError) {
      throw new AuthError(
        'El inicio de sesión con Google no está configurado correctamente.',
      );
    }

    if (error instanceof FirebaseError) {
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        return null;
      }

      throw new AuthError(
        googleSignInMessages[error.code] ??
          'No pudimos iniciar sesión con Google. Probá de nuevo.',
      );
    }

    throw error;
  }
}

export function logout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar
  }
}
