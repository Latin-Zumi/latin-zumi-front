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

  it('pasa los saldos y el movimiento de la respuesta al formato del front', async () => {
    mockFetch(
      jsonResponse(200, {
        transaction: { ...makeTransaction({ type: 'deposit' }), counterparty: null, exchange: null },
        source: { currency: 'USD', amount: '10.00', rate: '980' },
        balances: [
          {
            id: 'cuenta-1',
            user_id: TEST_SESSION.user.id,
            wallet_id: 'billetera-1',
            currency: 'ARS',
            account_type: 'user',
            allow_negative: false,
            balance: '9800.00',
          },
        ],
      }),
    );

    const result = await service.deposit({ currency: 'USD', amount: '10.00' }, 'clave-1');

    expect(result.balances).toEqual([
      { account_id: 'cuenta-1', wallet_id: 'billetera-1', currency: 'ARS', amount: '9800.00' },
    ]);
    // Sin contraparte ni cambio, los campos quedan ausentes en vez de null
    expect(result.transaction).not.toHaveProperty('counterparty');
    expect(result.transaction).not.toHaveProperty('exchange');
  });

  it('en el historial conserva el cambio y quita los null', async () => {
    const exchange = { to_currency: 'USD' as const, to_amount: '1.02', rate: '0.00102' };
    mockFetch(
      jsonResponse(200, {
        items: [
          { ...makeTransaction({ type: 'exchange' }), counterparty: null, exchange },
          { ...makeTransaction({ type: 'withdrawal' }), counterparty: null, exchange: null },
        ],
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      }),
    );

    const { items, total } = await service.getTransactions();

    expect(total).toBe(2);
    expect(items[0].exchange).toEqual(exchange);
    expect(items[0]).not.toHaveProperty('counterparty');
    expect(items[1]).not.toHaveProperty('exchange');
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
    [409, { code: 'QUOTE_ALREADY_USED' }, 'QUOTE_ALREADY_USED', 'Esa cotización ya se usó. Pedí una nueva.'],
    [404, { code: 'QUOTE_NOT_FOUND' }, 'QUOTE_NOT_FOUND', 'No encontramos esa cotización. Pedí una nueva.'],
    [404, { code: 'WALLET_NOT_FOUND' }, 'WALLET_NOT_FOUND', 'No encontramos tu billetera. Cerrá sesión y volvé a ingresar.'],
    [500, { code: 'ACCOUNT_NOT_FOUND' }, 'ACCOUNT_NOT_FOUND', 'No encontramos la cuenta de esa moneda en tu billetera.'],
    [400, { code: 'INVALID_IDEMPOTENCY_KEY' }, 'INVALID_IDEMPOTENCY_KEY', 'No pudimos procesar la operación. Empezá de nuevo.'],
    [503, { code: 'CONVERSION_UNAVAILABLE' }, 'CONVERSION_UNAVAILABLE', 'No hay una cotización disponible en este momento. Probá más tarde.'],
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
