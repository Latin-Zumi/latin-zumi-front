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

// El panel de admin muestra desde cuándo existe cada cuenta; la sesión no lo usa
export type MockUser = AuthUser & { created_at?: string };

const SEED_CREATED_AT = '2026-10-20T12:00:00.000Z';

const SEED_USERS: MockUser[] = [
  {
    id: 'mock-user-1',
    nombre: 'Valentina',
    email: 'valentina@latinzumi.test',
    pais: 'Argentina',
    moneda_preferida: 'ARS',
    roles: ['user'],
    estado: 'activo',
    created_at: SEED_CREATED_AT,
  },
  {
    id: 'mock-user-2',
    nombre: 'Mateo',
    email: 'mateo@latinzumi.test',
    pais: 'Colombia',
    moneda_preferida: 'COP',
    roles: ['user'],
    estado: 'activo',
    created_at: SEED_CREATED_AT,
  },
  {
    id: 'mock-admin-1',
    nombre: 'Admin',
    email: 'admin@latinzumi.test',
    pais: 'Argentina',
    moneda_preferida: 'ARS',
    roles: ['user', 'admin'],
    estado: 'activo',
    created_at: SEED_CREATED_AT,
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

function readUsers(): Record<string, MockUser> {
  const seed = Object.fromEntries(SEED_USERS.map((user) => [user.email, user]));
  return { ...seed, ...readJson<MockUser>(STORAGE_KEY) };
}

function writeUsers(users: Record<string, MockUser>) {
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

  const user: MockUser = {
    id: nextId(),
    nombre: data.nombre,
    email,
    pais: data.pais,
    moneda_preferida: CURRENCY_BY_COUNTRY[data.pais] ?? 'USD',
    roles: ['user'],
    estado: 'activo',
    created_at: new Date().toISOString(),
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

  const user: MockUser = {
    id: nextId(),
    nombre: data.nombre,
    email,
    pais: null,
    moneda_preferida: 'USD',
    roles: ['user'],
    estado: 'activo',
    foto_url: data.foto_url,
    created_at: new Date().toISOString(),
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

  const updated: MockUser = {
    ...current,
    ...changes,
    moneda_preferida: CURRENCY_BY_COUNTRY[changes.pais] ?? current.moneda_preferida,
  };
  writeUsers({ ...users, [key]: updated });
  return updated;
}

// Para el panel de admin: todos los usuarios mock
export function listMockUsers(): MockUser[] {
  return Object.values(readUsers());
}

// Simula el cambio de estado de PATCH /admin/users/:id
export function setMockUserStatus(id: string, estado: string): MockUser | null {
  const users = readUsers();
  const current = Object.values(users).find((user) => user.id === id);
  if (!current) return null;

  const updated: MockUser = { ...current, estado };
  writeUsers({ ...users, [current.email]: updated });
  return updated;
}
