import { updateMockUser } from '../mocks/users';
import { ApiConnectionError, apiRequest } from './apiClient';
import { getSession, type AuthUser } from './authService';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface ProfileData {
  nombre?: string;
  pais: string;
}

export class ProfileError extends Error {}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function updateProfile(data: ProfileData): Promise<AuthUser> {
  const session = getSession();
  if (!session) {
    throw new ProfileError('Necesitás iniciar sesión.');
  }

  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    const user = updateMockUser(session.user.email, data);
    if (!user) throw new ProfileError('No encontramos tu cuenta. Volvé a ingresar.');
    return user;
  }

  let response: Response;
  try {
    response = await apiRequest('/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    if (error instanceof ApiConnectionError) {
      throw new ProfileError('No pudimos conectar con el servidor. Probá de nuevo.');
    }
    throw error;
  }

  if (!response.ok) {
    throw new ProfileError(
      response.status === 401
        ? 'Tu sesión expiró. Volvé a iniciar sesión.'
        : 'No pudimos guardar tus datos. Probá de nuevo.',
    );
  }

  const { user } = (await response.json()) as { user: AuthUser };
  return user;
}
