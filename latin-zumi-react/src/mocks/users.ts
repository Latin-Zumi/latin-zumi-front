import type { AuthUser } from '../services/authService';

const STORAGE_KEY = 'latin-zumi:mock-users';
const PASSWORDS_KEY = 'latin-zumi:mock-passwords';

export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  Argentina: 'ARS',
  Colombia: 'COP',
  Otro: 'USD',
};

// Cuentas de prueba para VITE_USE_MOCK=true. Solo existen en el navegador.
export const MOCK_PASSWORD = 'LatinZumi1!';

const SEED_USERS: AuthUser[] = [
  {
    id: 'mock-user-1',
    nombre: 'Valentina',
    email: 'valentina@latinzumi.test',
    pais: 'Argentina',
    moneda_preferida: 'ARS',
    roles: ['user'],
    estado: 'activo',
  },
  {
    id: 'mock-user-2',
    nombre: 'Mateo',
    email: 'mateo@latinzumi.test',
    pais: 'Colombia',
    moneda_preferida: 'COP',
    roles: ['user'],
    estado: 'activo',
  },
];

function readJson<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage no disponible: los datos mock quedan solo en esta sesión
  }
}

function readUsers(): Record<string, AuthUser> {
  const seed = Object.fromEntries(SEED_USERS.map((user) => [user.email, user]));
  return { ...seed, ...readJson<AuthUser>(STORAGE_KEY) };
}

function writeUsers(users: Record<string, AuthUser>) {
  writeJson(STORAGE_KEY, users);
}

function readPasswords(): Record<string, string> {
  const seed = Object.fromEntries(SEED_USERS.map((user) => [user.email, MOCK_PASSWORD]));
  return { ...seed, ...readJson<string>(PASSWORDS_KEY) };
}

// El backend usa UUID para los ids
const nextId = () => crypto.randomUUID();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function findMockUser(email: string): AuthUser | null {
  return readUsers()[normalizeEmail(email)] ?? null;
}

// Simula POST /auth/login
export function loginMockUser(email: string, password: string): AuthUser | null {
  const key = normalizeEmail(email);
  const user = readUsers()[key];
  return user && readPasswords()[key] === password ? user : null;
}

// Simula POST /auth/register. Devuelve null si el email ya existe.
export function registerMockUser(data: {
  nombre: string;
  email: string;
  pais: string;
  password: string;
}): AuthUser | null {
  const users = readUsers();
  const email = normalizeEmail(data.email);
  if (users[email]) return null;

  const user: AuthUser = {
    id: nextId(),
    nombre: data.nombre,
    email,
    pais: data.pais,
    moneda_preferida: CURRENCY_BY_COUNTRY[data.pais] ?? 'USD',
    roles: ['user'],
    estado: 'activo',
  };
  writeUsers({ ...users, [email]: user });
  writeJson(PASSWORDS_KEY, { ...readJson<string>(PASSWORDS_KEY), [email]: data.password });
  return user;
}

// Simula lo que hace el backend en POST /auth/google: busca por email o crea el usuario
export function findOrCreateMockGoogleUser(data: {
  email: string;
  nombre: string;
  foto_url: string | null;
}): AuthUser {
  const users = readUsers();
  const email = normalizeEmail(data.email);
  const existing = users[email];
  if (existing) return existing;

  const user: AuthUser = {
    id: nextId(),
    nombre: data.nombre,
    email,
    pais: null,
    moneda_preferida: 'USD',
    roles: ['user'],
    estado: 'activo',
    foto_url: data.foto_url,
  };
  writeUsers({ ...users, [email]: user });
  return user;
}

// Simula PATCH /users/me
export function updateMockUser(
  email: string,
  changes: { nombre?: string; pais: string },
): AuthUser | null {
  const users = readUsers();
  const key = normalizeEmail(email);
  const current = users[key];
  if (!current) return null;

  const updated: AuthUser = {
    ...current,
    ...changes,
    moneda_preferida: CURRENCY_BY_COUNTRY[changes.pais] ?? current.moneda_preferida,
  };
  writeUsers({ ...users, [key]: updated });
  return updated;
}
