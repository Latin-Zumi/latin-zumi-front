import { ApiConnectionError, apiRequest, postJson, readErrorCode } from './apiClient';
import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { FirebaseConfigurationError, getFirebaseAuth } from './firebase';
import {
  changeMockPassword,
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
  id: string; // UUID
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
  // El back la pide cuando la contraseña es vieja (menos de 8 caracteres); mientras tanto responde 403
  password_change_required?: boolean;
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

  // Solo se guarda una sesión con la forma que espera el resto de la app
  const data = (await response.json()) as Partial<Session>;
  if (
    !data.token ||
    !data.user ||
    typeof data.user.id !== 'string' ||
    !Array.isArray(data.user.roles)
  ) {
    throw new AuthError('Respuesta inválida del servidor.');
  }

  const session: Session = {
    token: data.token,
    user: data.user,
    ...(data.password_change_required && { password_change_required: true }),
  };
  saveSession(session);
  return session;
}

const BLOCKED_MESSAGE = 'Tu cuenta está bloqueada. Escribinos para reactivarla.';

// La lógica sale del status HTTP: el body de los errores no es uniforme (el 429 manda { error })
function authErrorFor(status: number, messages: Record<number, string>, fallback: string): AuthError {
  if (messages[status]) return new AuthError(messages[status]);
  // El back responde 403 USER_BLOCKED cuando un admin bloqueó la cuenta
  if (status === 403) return new AuthError(BLOCKED_MESSAGE);
  if (status === 429) return new AuthError('Demasiados intentos. Esperá unos minutos.');
  if (status >= 500) return new AuthError('No pudimos conectar con el servidor. Probá de nuevo.');
  return new AuthError(fallback);
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
    if (!user) throw new AuthError('Email o contraseña incorrectos.');
    return startMockSession(user);
  }

  // El backend recibe el email (o username) en "identifier"
  return requestSession(
    '/auth/login',
    { identifier: credentials.email, password: credentials.password },
    (status) =>
      authErrorFor(
        status,
        {
          400: 'Revisá los datos ingresados.',
          401: 'Email o contraseña incorrectos.',
        },
        'No pudimos iniciar sesión. Probá de nuevo.',
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
    authErrorFor(
      status,
      {
        400: 'Revisá los datos ingresados.',
        409: 'Ya existe una cuenta con ese email.',
      },
      'No pudimos crear la cuenta. Probá de nuevo.',
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
  if (status === 403) return new AuthError(BLOCKED_MESSAGE);
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

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar
  }
}

// Revoca el token en el backend. La sesión local se borra siempre, aunque falle la red
// o el token ya esté vencido (401).
export async function logout(): Promise<void> {
  const session = getSession();
  try {
    if (session && !USE_MOCK) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
    }
  } catch {
    // best effort
  } finally {
    clearSession();
  }
}

async function postAuth(path: string, body: unknown, token?: string): Promise<Response> {
  try {
    return await apiRequest(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof ApiConnectionError) {
      throw new AuthError('No pudimos conectar con el servidor. Probá de nuevo.');
    }
    throw error;
  }
}

// El back responde 202 exista o no el email, para no revelar qué cuentas existen
export async function forgotPassword(email: string): Promise<void> {
  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    return;
  }

  const response = await postAuth('/auth/forgot-password', { email });
  if (!response.ok) {
    throw authErrorFor(response.status, { 400: 'Ingresá un email válido.' }, 'No pudimos enviar el pedido. Probá de nuevo.');
  }
}

// Cuando el enlace del email venció o ya se usó
export class ResetTokenError extends AuthError {}

export async function resetPassword(token: string, password: string): Promise<void> {
  if (USE_MOCK) {
    await delay(400); // el mock no envía emails: cualquier token sirve
    return;
  }

  const response = await postAuth('/auth/reset-password', { token, password });
  if (response.ok) return;

  if ((await readErrorCode(response)) === 'INVALID_RESET_TOKEN') {
    throw new ResetTokenError('El enlace venció o ya fue usado. Pedí uno nuevo.');
  }
  throw authErrorFor(
    response.status,
    { 400: 'La contraseña no cumple los requisitos necesarios.' },
    'No pudimos cambiar la contraseña. Probá de nuevo.',
  );
}

// El token venció: hay que volver a iniciar sesión
export class SessionExpiredError extends AuthError {}

const CHANGE_PASSWORD_ERRORS: Record<string, string> = {
  INVALID_CURRENT_PASSWORD: 'La contraseña actual es incorrecta.',
  PASSWORD_UNCHANGED: 'La nueva contraseña tiene que ser distinta de la actual.',
  PASSWORD_NOT_SET: 'Tu cuenta entra con Google y no tiene contraseña.',
  CONFLICT: 'Tu contraseña cambió en otro dispositivo. Volvé a iniciar sesión.',
};

// El back mantiene esta sesión, revoca las demás y deja de pedir el cambio
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const session = getSession();
  if (!session) throw new SessionExpiredError('Necesitás iniciar sesión.');

  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    const result = changeMockPassword(session.user.email, currentPassword, newPassword);
    if (result !== 'ok') throw new AuthError(CHANGE_PASSWORD_ERRORS[result]);
    return;
  }

  const response = await postAuth(
    '/auth/change-password',
    { current_password: currentPassword, new_password: newPassword },
    session.token,
  );
  if (response.ok) return;

  const code = await readErrorCode(response);
  if (code && CHANGE_PASSWORD_ERRORS[code]) throw new AuthError(CHANGE_PASSWORD_ERRORS[code]);
  // Un 401 sin código es el token vencido, no la contraseña actual
  if (response.status === 401) throw new SessionExpiredError('Tu sesión expiró. Volvé a iniciar sesión.');
  throw authErrorFor(
    response.status,
    { 400: 'La contraseña no cumple los requisitos necesarios.' },
    'No pudimos cambiar la contraseña. Probá de nuevo.',
  );
}
