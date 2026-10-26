import { mockBalances } from '../mocks/balances';
import { getSession } from './authService';
import type { Balance } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class WalletError extends Error {}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getBalances(): Promise<Balance[]> {
  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    return structuredClone(mockBalances);
  }

  const session = getSession();
  if (!session) {
    throw new WalletError('Necesitás iniciar sesión.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/wallet/balances`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } catch {
    throw new WalletError('No pudimos conectar con el servidor. Probá de nuevo.');
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
