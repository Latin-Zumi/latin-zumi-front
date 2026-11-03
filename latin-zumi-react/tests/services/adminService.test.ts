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

type AdminService = typeof import('../../src/services/adminService');
const load = (useMock: boolean) => loadWithEnv(useMock, () => import('../../src/services/adminService'));

const ADMIN_SESSION = {
  token: 'token-admin',
  user: { ...TEST_SESSION.user, id: 'mock-admin-1', email: 'admin@latinzumi.test', roles: ['user', 'admin'] },
};

describe('adminService con la API real', () => {
  let service: AdminService;

  beforeEach(async () => {
    service = await load(false);
    storeSession(ADMIN_SESSION);
  });

  it('sin sesión falla con UNAUTHORIZED, sin llamar al backend', async () => {
    localStorage.clear();
    const fetchMock = mockFetch();

    await expect(service.getSettings()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pide las métricas del período con el token', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { data: { period: 'month', users: {}, volume: [] } }));

    await service.getMetrics('month');

    const call = fetchCall(fetchMock);
    expect(call.url).toBe(`${API_URL}/admin/metrics?period=month`);
    expect(call.headers.get('Authorization')).toBe('Bearer token-admin');
  });

  it('guarda los parámetros con PATCH y manda las tasas como mapa', async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, { data: { exchange_spread_percent: '1.50', interest_rates: [] } }),
    );

    const updated = await service.updateSettings({
      exchange_spread_percent: '1.50',
      interest_rates: [
        { currency: 'USD', annual_percent: '4.00' },
        { currency: 'ARS', annual_percent: '0.00' },
      ],
    });

    const call = fetchCall(fetchMock);
    expect(call.url).toBe(`${API_URL}/admin/settings`);
    expect(call.method).toBe('PATCH');
    expect(call.headers.get('Content-Type')).toBe('application/json');
    expect(call.body).toEqual({
      exchange_spread_percent: '1.50',
      interest_rates: { USD: '4.00', ARS: '0.00' },
    });
    expect(updated.exchange_spread_percent).toBe('1.50');
  });

  it('la búsqueda de usuarios no manda los filtros vacíos', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { data: { items: [], page: 1, total: 0 } }));

    await service.getUsers({ search: 'vale', estado: undefined, page: 1 });

    expect(fetchCall(fetchMock).url).toBe(`${API_URL}/admin/users?search=vale&page=1`);
  });

  it('el detalle pasa los saldos y movimientos al formato del front', async () => {
    mockFetch(
      jsonResponse(200, {
        data: {
          user: { id: 'u1', nombre: 'Vale', email: 'v@x.test', pais: null, roles: ['user'], estado: 'activo', created_at: '' },
          balances: [{ id: 'cuenta-1', wallet_id: 'billetera-1', account_id: 'cuenta-1', currency: 'USD', balance: '10.00' }],
          recent_transactions: [{ ...makeTransaction(), counterparty: null, exchange: null }],
        },
      }),
    );

    const detail = await service.getUser('u1');

    expect(detail.balances).toEqual([
      { account_id: 'cuenta-1', wallet_id: 'billetera-1', currency: 'USD', amount: '10.00' },
    ]);
    expect(detail.recent_transactions[0]).not.toHaveProperty('counterparty');
  });

  it('cambiar el estado devuelve el usuario actualizado', async () => {
    const user = { id: 'u1', estado: 'bloqueado' };
    const fetchMock = mockFetch(jsonResponse(200, { data: { user } }));

    await expect(service.setUserStatus('u1', 'bloqueado')).resolves.toEqual(user);
    expect(fetchCall(fetchMock).body).toEqual({ estado: 'bloqueado' });
  });

  it.each([
    [403, undefined, 'FORBIDDEN'],
    [422, { code: 'CANNOT_BLOCK_SELF' }, 'CANNOT_BLOCK_SELF'],
    [404, { code: 'USER_NOT_FOUND' }, 'USER_NOT_FOUND'],
    [429, { code: 'TOO_MANY_REQUESTS' }, 'TOO_MANY_REQUESTS'],
    [401, undefined, 'UNAUTHORIZED'],
    [500, { code: 'ALGO_NUEVO' }, 'UNKNOWN'],
  ])('con status %i y body %j falla con %s', async (status, body, code) => {
    mockFetch(jsonResponse(status, body));

    const error = await service.setUserStatus('u1', 'bloqueado').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(service.AdminError);
    expect(error).toMatchObject({ code });
  });

  it('sin conexión falla con CONNECTION', async () => {
    mockFetchNetworkError();

    await expect(service.getMetrics('day')).rejects.toMatchObject({ code: 'CONNECTION' });
  });
});

describe('adminService en modo mock', () => {
  let service: AdminService;

  beforeEach(async () => {
    service = await load(true);
    storeSession(ADMIN_SESSION);
    vi.useFakeTimers();
  });

  async function run<T>(promise: Promise<T>): Promise<T> {
    await vi.advanceTimersByTimeAsync(300);
    return promise;
  }

  it('un usuario sin rol admin recibe FORBIDDEN', async () => {
    storeSession();
    const assertion = expect(service.getSettings()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await vi.advanceTimersByTimeAsync(300);
    await assertion;
  });

  it('guardar parámetros registra en el historial solo lo que cambió', async () => {
    const updated = await run(
      service.updateSettings({
        exchange_spread_percent: '1.50',
        interest_rates: [
          { currency: 'USD', annual_percent: '4.00' },
          { currency: 'ARS', annual_percent: '0.00' },
        ],
      }),
    );
    const history = await run(service.getSettingsHistory());

    expect(updated.exchange_spread_percent).toBe('1.50');
    expect(updated.updated_by?.email).toBe('admin@latinzumi.test');
    expect(history.items.map((change) => change.field).sort()).toEqual([
      'exchange_spread_percent',
      'interest_rates.USD',
    ]);
  });

  it('bloquea a otro usuario pero no a uno mismo', async () => {
    const user = await run(service.setUserStatus('mock-user-2', 'bloqueado'));
    expect(user.estado).toBe('bloqueado');

    const { items } = await run(service.getUsers({ estado: 'bloqueado' }));
    expect(items.map((item) => item.id)).toEqual(['mock-user-2']);

    const assertion = expect(service.setUserStatus('mock-admin-1', 'bloqueado')).rejects.toMatchObject({
      code: 'CANNOT_BLOCK_SELF',
    });
    await vi.advanceTimersByTimeAsync(300);
    await assertion;
  });
});
