import { z } from 'zod';
import {
  getMockWalletRates,
  mockRateHistory,
  type QuotedCurrency,
  type RatePoint,
} from '../mocks/rates';
import type { WalletRates } from '../types';
import { apiRequest } from './apiClient';
import { getSession } from './authService';

export type { QuotedCurrency, RatePoint };

export const QUOTED_CURRENCIES: QuotedCurrency[] = ['EUR', 'ARS', 'COP'];

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const rate = z.coerce.number().positive();
const percent = z.string().refine((value) => Number.isFinite(Number(value)));

const walletRatesSchema = z.object({
  data: z.object({
    rates: z.object({ USD: rate, ARS: rate, COP: rate, EUR: rate }),
    observed_at: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
    exchange_spread_percent: percent,
    interest_rates: z
      .array(z.object({ currency: z.enum(['USD', 'ARS', 'COP', 'EUR']), annual_percent: percent }))
      .min(1),
  }),
});

// Tasas, comisión e interés vigentes. Si faltan datos, falla: no se muestran valores inventados.
export async function getWalletRates(): Promise<WalletRates> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300)); // simula la latencia de la API
    return getMockWalletRates();
  }

  const session = getSession();
  if (!session) throw new Error('Sin sesión');

  const response = await apiRequest('/wallet/rates', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!response.ok) throw new Error(`Tasas no disponibles: ${response.status}`);

  return walletRatesSchema.parse(await response.json()).data;
}

// Historial para el gráfico de la home. Futuro: reemplazar por la API de cotizaciones
export function getRateHistory(currency: QuotedCurrency, days: number): RatePoint[] {
  return mockRateHistory[currency].slice(-days);
}

export function getChange(points: RatePoint[]): number {
  const first = points[0].value;
  const last = points[points.length - 1].value;
  return ((last - first) / first) * 100;
}

export function formatRate(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: value < 10 ? 4 : 2,
    maximumFractionDigits: value < 10 ? 4 : 2,
  }).format(value);
}

export function formatChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2).replace('.', ',')}%`;
}
