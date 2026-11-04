import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_URL, fetchCall, jsonResponse, loadWithEnv, mockFetch, storeSession, TEST_SESSION } from '../helpers/api';

type RatesService = typeof import('../../src/services/ratesService');
const load = (useMock: boolean) => loadWithEnv(useMock, () => import('../../src/services/ratesService'));

const RESPONSE = {
  base: 'USD',
  rates: { USD: '1', ARS: '1450.25', COP: '4100.50', EUR: '0.92' },
  observed_at: '2026-11-04T18:00:00.000Z',
  exchange_spread_percent: '0.00',
  interest_rates: [{ currency: 'USD', annual_percent: '0.00' }],
};

describe('getWalletRates con la API real', () => {
  let service: RatesService;

  beforeEach(async () => {
    service = await load(false);
    storeSession();
  });

  it('manda el token y convierte las tasas a número', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { data: RESPONSE }));

    const result = await service.getWalletRates();

    const call = fetchCall(fetchMock);
    expect(call.url).toBe(`${API_URL}/wallet/rates`);
    expect(call.headers.get('Authorization')).toBe(`Bearer ${TEST_SESSION.token}`);
    expect(result.rates.ARS).toBe(1450.25);
    expect(result.exchange_spread_percent).toBe('0.00');
  });

  it('sin sesión falla sin llamar al backend', async () => {
    localStorage.clear();
    const fetchMock = mockFetch();

    await expect(service.getWalletRates()).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 404, 503])('falla con status %i', async (status) => {
    mockFetch(jsonResponse(status, { code: 'X' }));

    await expect(service.getWalletRates()).rejects.toThrow();
  });

  it.each([
    ['falta una moneda', { ...RESPONSE, rates: { USD: '1', ARS: '1450.25', COP: '4100.50' } }],
    ['una tasa es cero', { ...RESPONSE, rates: { ...RESPONSE.rates, EUR: '0' } }],
    ['no hay interés', { ...RESPONSE, interest_rates: [] }],
    ['la comisión no es un número', { ...RESPONSE, exchange_spread_percent: 'abc' }],
  ])('falla si %s', async (_case, data) => {
    mockFetch(jsonResponse(200, { data }));

    await expect(service.getWalletRates()).rejects.toThrow();
  });
});

describe('getWalletRates en modo mock', () => {
  let service: RatesService;

  beforeEach(async () => {
    service = await load(true);
    vi.useFakeTimers();
  });

  async function getRates() {
    const pending = service.getWalletRates();
    await vi.advanceTimersByTimeAsync(300);
    return pending;
  }

  it('devuelve las cuatro monedas con comisión e interés en cero, sin llamar al backend', async () => {
    const fetchMock = mockFetch();

    const result = await getRates();

    expect(result.rates.USD).toBe(1);
    expect(result.rates.ARS).toBeGreaterThan(0);
    expect(result.exchange_spread_percent).toBe('0.00');
    expect(result.interest_rates.map(({ annual_percent }) => annual_percent)).toEqual(['0.00', '0.00', '0.00', '0.00']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('usa la comisión cargada en el panel', async () => {
    const { SETTINGS_KEY, readMockSettings } = await import('../../src/mocks/settings');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readMockSettings(), exchange_spread_percent: '2.50' }));

    expect((await getRates()).exchange_spread_percent).toBe('2.50');
  });
});
