const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
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

export async function login(credentials: LoginCredentials): Promise<Session> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new AuthError('No pudimos conectar con el servidor. Probá de nuevo.');
  }

  if (!response.ok) {
    throw new AuthError(
      response.status === 401
        ? 'Email o contraseña incorrectos.'
        : 'No pudimos iniciar sesión. Probá de nuevo.',
    );
  }

  const data = (await response.json()) as Session;
  const session: Session = { token: data.token, user: data.user };
  saveSession(session);
  return session;
}

export async function register(data: RegisterData): Promise<Session> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new AuthError('No pudimos conectar con el servidor. Probá de nuevo.');
  }

  if (!response.ok) {
    throw new AuthError(
      response.status === 409
        ? 'Ya existe una cuenta con ese email.'
        : 'No pudimos crear la cuenta. Probá de nuevo.',
    );
  }

  const body = (await response.json()) as Session;
  const session: Session = { token: body.token, user: body.user };
  saveSession(session);
  return session;
}

export function logout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar
  }
}