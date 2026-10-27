import type { AuthUser } from '../services/authService';

const STORAGE_KEY = 'latin-zumi:mock-users';

export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  Argentina: 'ARS',
  Colombia: 'COP',
  Otro: 'USD',
};

function readUsers(): Record<string, AuthUser> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AuthUser>) : {};
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, AuthUser>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // storage no disponible: el usuario mock queda solo en esta sesión
  }
}

// Simula lo que hace el backend en POST /auth/google: busca por email o crea el usuario
export function findOrCreateMockGoogleUser(data: {
  email: string;
  nombre: string;
  foto_url: string | null;
}): AuthUser {
  const users = readUsers();
  const existing = users[data.email];
  if (existing) return existing;

  const user: AuthUser = {
    id: Object.keys(users).length + 1000,
    nombre: data.nombre,
    email: data.email,
    pais: null,
    moneda_preferida: 'USD',
    roles: ['user'],
    estado: 'activo',
    foto_url: data.foto_url,
  };
  writeUsers({ ...users, [data.email]: user });
  return user;
}

// Simula PATCH /users/me
export function updateMockUser(
  email: string,
  changes: { nombre?: string; pais: string },
): AuthUser | null {
  const users = readUsers();
  const current = users[email];
  if (!current) return null;

  const updated: AuthUser = {
    ...current,
    ...changes,
    moneda_preferida: CURRENCY_BY_COUNTRY[changes.pais] ?? current.moneda_preferida,
  };
  writeUsers({ ...users, [email]: updated });
  return updated;
}
