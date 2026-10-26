import { ApiConnectionError, postJson } from './apiClient';

const STORAGE_KEY = 'latin-zumi:session';

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
  pais: string;
  moneda_preferida: string;
  roles: string[];
  estado: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export class AuthError extends Error {}

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

  const data = (await response.json()) as Session;
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