import { ApiConnectionError, postJson } from './apiClient';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  FirebaseConfigurationError,
  getFirebaseAuth,
} from './firebase';

const STORAGE_KEY = 'latin-zumi:session';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  nombre: string;
  pais: string;
}

export interface BackendAuthUser {
  id: number;
  nombre: string;
  email: string;
  pais: string;
  moneda_preferida: string;
  roles: string[];
  estado: string;
}

export interface GoogleAuthUser {
  authProvider: 'google';
  uid: string;
  nombre: string | null;
  email: string | null;
  photoURL: string | null;
}

export type AuthUser = BackendAuthUser | GoogleAuthUser;

export type Session =
  | {
      token: string;
      user: BackendAuthUser;
      authProvider?: 'backend';
    }
  | {
      token: string;
      user: GoogleAuthUser;
      authProvider: 'firebase';
    };

export class AuthError extends Error {}

function createGoogleSession(user: FirebaseUser): Promise<Session> {
  return user.getIdToken().then((token) => ({
    token,
    authProvider: 'firebase',
    user: {
      authProvider: 'google',
      uid: user.uid,
      nombre: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    },
  }));
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

export async function loginWithGoogle(): Promise<Session | null> {
  try {
    const result = await signInWithPopup(
      getFirebaseAuth(),
      new GoogleAuthProvider(),
    );
    const session = await createGoogleSession(result.user);
    logout();
    return session;
  } catch (error) {
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

export function createFirebaseSession(user: FirebaseUser): Promise<Session> {
  return createGoogleSession(user);
}

export function isFirebaseSession(
  session: Session,
): session is Extract<Session, { authProvider: 'firebase' }> {
  return session.authProvider === 'firebase';
}

function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage no disponible: la sesión queda solo en memoria
  }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

interface AuthFailureMessages {
  status: number;
  statusMessage: string;
  fallbackMessage: string;
}

async function postSession(
  path: string,
  body: LoginCredentials | RegisterData,
  messages: AuthFailureMessages,
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

  if (!response.ok) {
    throw new AuthError(
      response.status === messages.status
        ? messages.statusMessage
        : messages.fallbackMessage,
    );
  }

  const data = (await response.json()) as Extract<
    Session,
    { authProvider?: 'backend' }
  >;
  const session: Session = { token: data.token, user: data.user };
  saveSession(session);
  return session;
}

export function login(credentials: LoginCredentials): Promise<Session> {
  return postSession('/auth/login', credentials, {
    status: 401,
    statusMessage: 'Email o contraseña incorrectos.',
    fallbackMessage: 'No pudimos iniciar sesión. Probá de nuevo.',
  });
}

export function register(data: RegisterData): Promise<Session> {
  return postSession('/auth/register', data, {
    status: 409,
    statusMessage: 'Ya existe una cuenta con ese email.',
    fallbackMessage: 'No pudimos crear la cuenta. Probá de nuevo.',
  });
}

export function logout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar
  }
}