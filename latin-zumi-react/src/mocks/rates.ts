import type { Currency } from '../types';

export interface RatePoint {
  date: string; // YYYY-MM-DD
  value: number; // unidades de la moneda por 1 USD
}

export type QuotedCurrency = Exclude<Currency, 'USD'>;

const DAYS = 90;

// Generador pseudoaleatorio con semilla para que el mock sea siempre igual
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildHistory(
  current: number,
  drift: number,
  volatility: number,
  seed: number,
): RatePoint[] {
  const random = seeded(seed);
  const values = [current];
  // Se camina hacia atrás desde el valor actual
  for (let i = 1; i < DAYS; i++) {
    const change = drift + (random() - 0.5) * volatility;
    values.unshift(values[0] / (1 + change));
  }

  const today = new Date();
  return values.map((value, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (DAYS - 1 - i));
    return { date: date.toISOString().slice(0, 10), value };
  });
}

export const mockRateHistory: Record<QuotedCurrency, RatePoint[]> = {
  EUR: buildHistory(0.94, -0.0004, 0.008, 7),
  ARS: buildHistory(980, 0.0025, 0.012, 21),
  COP: buildHistory(4200, -0.0006, 0.014, 42),
};
