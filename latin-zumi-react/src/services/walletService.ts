import { getMockBalances } from '../mocks/wallets';
import { getSession } from './authService';
import { ApiConnectionError, apiRequest } from './apiClient';
import type { Balance, Currency } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class WalletError extends Error {}

// 401: el token venció o fue revocado. Hay que cerrar la sesión.
export class WalletSessionExpiredError extends WalletError {}

// Cuenta tal como la devuelve GET /accounts
interface AccountResponse {
  id: string;
  wallet_id: string;
  currency: Currency;
  balance: string;
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getBalances(): Promise<Balance[]> {
  const session = getSession();
  if (!session) {
    throw new WalletSessionExpiredError('Necesitás iniciar sesión.');
  }

  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    const result = getMockBalances(session.user.email);
    if (!result.ok) throw new WalletError('No pudimos cargar tus balances. Probá de nuevo.');
    return result.data;
  }

  let response: Response;
  try {
    response = await apiRequest('/accounts', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } catch (error) {
    if (error instanceof ApiConnectionError) {
      throw new WalletError('No pudimos conectar con el servidor. Probá de nuevo.');
    }
    throw error;
  }

  if (response.status === 401) {
    throw new WalletSessionExpiredError('Tu sesión expiró. Volvé a iniciar sesión.');
  }
  // 403: usuario con contraseña vieja. La sesión sigue siendo válida, no se borra.
  if (response.status === 403) {
    throw new WalletError('Tenés que cambiar tu contraseña antes de ver tus balances.');
  }
  if (!response.ok) {
    throw new WalletError('No pudimos cargar tus balances. Probá de nuevo.');
  }

  // Los saldos en "0" también se muestran
  const { data } = (await response.json()) as { data: AccountResponse[] };
  return data.map((account) => ({
    account_id: account.id,
    wallet_id: account.wallet_id,
    currency: account.currency,
    amount: account.balance,
  }));
}
