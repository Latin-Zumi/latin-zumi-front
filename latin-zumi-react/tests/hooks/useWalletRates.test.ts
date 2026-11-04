import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWalletRates } from '../../src/hooks/useWalletRates';
import { getWalletRates } from '../../src/services/ratesService';
import type { WalletRates } from '../../src/types';

vi.mock('../../src/services/ratesService', () => ({ getWalletRates: vi.fn() }));

const getRatesMock = vi.mocked(getWalletRates);
const RATES: WalletRates = {
  rates: { USD: 1, ARS: 1000, COP: 4000, EUR: 0.9 },
  observed_at: '2026-11-04T18:00:00.000Z',
  exchange_spread_percent: '0.00',
  interest_rates: [{ currency: 'USD', annual_percent: '0.00' }],
};

describe('useWalletRates', () => {
  beforeEach(() => getRatesMock.mockReset());

  it('empieza cargando y después entrega los datos', async () => {
    getRatesMock.mockResolvedValue(RATES);
    const { result } = renderHook(() => useWalletRates());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(RATES));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('si falla marca el error y al reintentar vuelve a pedir', async () => {
    getRatesMock.mockRejectedValueOnce(new Error('caído')).mockResolvedValueOnce(RATES);
    const { result } = renderHook(() => useWalletRates());

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.data).toBeNull();

    act(() => result.current.reload());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(RATES));
    expect(getRatesMock).toHaveBeenCalledTimes(2);
  });
});
