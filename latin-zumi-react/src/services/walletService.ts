import { getMockBalances } from '../mocks/wallets';
import { getSession } from './authService';
import { ApiConnectionError, apiRequest } from './apiClient';
import type { Balance } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class WalletError extends Error {}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getBalances(): Promise<Balance[]> {
  const session = getSession();
  if (!session) {
    throw new WalletError('Necesitás iniciar sesión.');
  }

  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    const result = getMockBalances(session.user.email);
    if (!result.ok) throw new WalletError('No pudimos cargar tus balances. Probá de nuevo.');
    return result.data;
  }

  let response: Response;
  try {
    response = await apiRequest('/wallet/balances', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } catch (error) {
    if (error instanceof ApiConnectionError) {
      throw new WalletError('No pudimos conectar con el servidor. Probá de nuevo.');
    }
    throw error;
  }

  if (!response.ok) {
    throw new WalletError(
      response.status === 401
        ? 'Tu sesión expiró. Volvé a iniciar sesión.'
        : 'No pudimos cargar tus balances. Probá de nuevo.',
    );
  }

  return (await response.json()) as Balance[];
}
