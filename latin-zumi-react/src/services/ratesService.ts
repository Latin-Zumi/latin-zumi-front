import { mockRateHistory, type QuotedCurrency, type RatePoint } from '../mocks/rates';

export type { QuotedCurrency, RatePoint };

export const QUOTED_CURRENCIES: QuotedCurrency[] = ['EUR', 'ARS', 'COP'];

// Futuro: reemplazar por la API de cotizaciones
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
