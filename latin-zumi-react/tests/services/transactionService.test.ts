import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import { makeTransaction } from '../helpers/factories';

type TransactionService = typeof import('../../src/services/transactionService');
const load = (useMock: boolean) =>
  loadWithEnv(useMock, () => import('../../src/services/transactionService'));

const TRANSFER = { recipient_email: 'mateo@latinzumi.test', currency: 'ARS' as const, amount: '100.00' };

describe('transactionService con la API real', () => {
  let service: TransactionService;

  beforeEach(async () => {
    service = await load(false);
    storeSession();
  });

  it('sin sesión falla con UNAUTHORIZED, sin llamar al backend', async () => {
    localStorage.clear();
    const fetchMock = mockFetch();

    await expect(service.getTransactions()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('la transferencia manda el token, la Idempotency-Key y los datos', async () => {
    const result = { transaction: makeTransaction({ type: 'transfer_sent' }), balances: [] };
    const fetchMock = mockFetch(jsonResponse(201, result));

    await expect(service.transfer(TRANSFER, 'clave-1')).resolves.toEqual(result);

    const call = fetchCall(fetchMock);
    expect(call.url).toBe(`${API_URL}/wallet/transfers`);
    expect(call.method).toBe('POST');
    expect(call.headers.get('Authorization')).toBe(`Bearer ${TEST_SESSION.token}`);
    expect(call.headers.get('Idempotency-Key')).toBe('clave-1');
    expect(call.headers.get('Content-Type')).toBe('application/json');
    expect(call.body).toEqual(TRANSFER);
  });

  it('arma la URL de los filtros sin los que vienen vacíos', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { items: [], page: 2, total: 0 }));

    await service.getTransactions({ type: 'deposit', page: 2 });

    expect(fetchCall(fetchMock).url).toBe(`${API_URL}/wallet/transactions?type=deposit&page=2`);
  });

  it('pide la cotización con las dos monedas y el monto', async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, { quote_id: 'q1', rate: '980', to_amount: '1.02', expires_at: '' }),
    );

    await service.getExchangeQuote('ARS', 'USD', '1000.00');

    expect(fetchCall(fetchMock).url).toBe(
      `${API_URL}/wallet/exchange/quote?from=ARS&to=USD&amount=1000.00`,
    );
  });

  it.each([
    [422, { code: 'INSUFFICIENT_FUNDS' }, 'INSUFFICIENT_FUNDS', 'No tenés saldo suficiente en esa moneda.'],
    [404, { code: 'RECIPIENT_NOT_FOUND' }, 'RECIPIENT_NOT_FOUND', 'No encontramos una cuenta con ese email.'],
    [401, undefined, 'UNAUTHORIZED', 'Tu sesión expiró. Volvé a iniciar sesión.'],
    [500, { code: 'ALGO_NUEVO' }, 'UNKNOWN', 'No pudimos completar la operación. Probá de nuevo.'],
  ])('con status %i y body %j falla con %s', async (status, body, code, message) => {
    mockFetch(jsonResponse(status, body));

    const error = await service.transfer(TRANSFER, 'clave-1').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(service.TransactionError);
    expect(error).toMatchObject({ code, message });
  });

  it('sin conexión falla con CONNECTION', async () => {
    mockFetchNetworkError();

    await expect(service.deposit({ currency: 'ARS', amount: '10' }, 'clave-1')).rejects.toMatchObject({
      code: 'CONNECTION',
    });
  });
});

describe('transactionService en modo mock', () => {
  let service: TransactionService;

  beforeEach(async () => {
    service = await load(true);
    storeSession();
    // El mock espera 400 ms para simular la API; con timers falsos el test no espera de verdad
    vi.useFakeTimers();
  });

  async function run<T>(promise: Promise<T>): Promise<T> {
    await vi.advanceTimersByTimeAsync(400);
    return promise;
  }

  const balanceOf = (result: { balances: { currency: string; amount: string }[] }) =>
    result.balances.find((balance) => balance.currency === 'ARS')?.amount;

  it('repetir un depósito con la misma Idempotency-Key no lo acredita dos veces', async () => {
    const first = await run(service.deposit({ currency: 'ARS', amount: '50' }, 'misma-clave'));
    const second = await run(service.deposit({ currency: 'ARS', amount: '50' }, 'misma-clave'));
    const other = await run(service.deposit({ currency: 'ARS', amount: '50' }, 'otra-clave'));

    expect(second.transaction.id).toBe(first.transaction.id);
    expect(balanceOf(second)).toBe(balanceOf(first));
    expect(Number(balanceOf(other))).toBe(Number(balanceOf(first)) + 50);
  });

  it('no deja transferirse a uno mismo', async () => {
    const assertion = expect(
      service.transfer({ ...TRANSFER, recipient_email: TEST_SESSION.user.email }, 'clave-1'),
    ).rejects.toMatchObject({ code: 'SELF_TRANSFER' });
    await vi.advanceTimersByTimeAsync(400);
    await assertion;
  });
});
