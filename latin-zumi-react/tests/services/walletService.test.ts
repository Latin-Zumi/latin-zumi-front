import { beforeEach, describe, expect, it } from 'vitest';
import {
  API_URL,
  fetchCall,
  jsonResponse,
  loadWithEnv,
  mockFetch,
  mockFetchNetworkError,
  storeSession,
  TEST_SESSION,
} from '../helpers/api';

type WalletService = typeof import('../../src/services/walletService');

describe('walletService con la API real', () => {
  let wallet: WalletService;

  beforeEach(async () => {
    wallet = await loadWithEnv(false, () => import('../../src/services/walletService'));
  });

  it('sin sesión pide iniciarla, sin llamar al backend', async () => {
    const fetchMock = mockFetch();

    await expect(wallet.getBalances()).rejects.toBeInstanceOf(wallet.WalletSessionExpiredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pide GET /accounts con el token y convierte cada cuenta en un saldo', async () => {
    storeSession();
    const fetchMock = mockFetch(
      jsonResponse(200, {
        data: [
          {
            id: 'cuenta-1',
            user_id: TEST_SESSION.user.id,
            wallet_id: 'billetera-1',
            currency: 'ARS',
            account_type: 'main',
            allow_negative: false,
            balance: '0',
          },
        ],
      }),
    );

    const balances = await wallet.getBalances();

    const call = fetchCall(fetchMock);
    expect(call.url).toBe(`${API_URL}/accounts`);
    expect(call.headers.get('Authorization')).toBe(`Bearer ${TEST_SESSION.token}`);
    // Un saldo en "0" también se muestra
    expect(balances).toEqual([
      { account_id: 'cuenta-1', wallet_id: 'billetera-1', currency: 'ARS', amount: '0' },
    ]);
  });

  it('con 401 avisa que la sesión venció', async () => {
    storeSession();
    mockFetch(jsonResponse(401));

    await expect(wallet.getBalances()).rejects.toBeInstanceOf(wallet.WalletSessionExpiredError);
  });

  it('con 403 pide cambiar la contraseña, pero no lo trata como sesión vencida', async () => {
    storeSession();
    mockFetch(jsonResponse(403));

    const error = await wallet.getBalances().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(wallet.WalletError);
    expect(error).not.toBeInstanceOf(wallet.WalletSessionExpiredError);
    expect((error as Error).message).toBe(
      'Tenés que cambiar tu contraseña antes de ver tus balances.',
    );
  });

  it('con un error del servidor o sin conexión muestra un mensaje para reintentar', async () => {
    storeSession();
    mockFetch(jsonResponse(500));
    await expect(wallet.getBalances()).rejects.toThrow(
      'No pudimos cargar tus balances. Probá de nuevo.',
    );

    mockFetchNetworkError();
    await expect(wallet.getBalances()).rejects.toThrow(
      'No pudimos conectar con el servidor. Probá de nuevo.',
    );
  });
});
