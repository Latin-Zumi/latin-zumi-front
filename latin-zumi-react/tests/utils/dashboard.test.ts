import { describe, expect, it } from 'vitest';
import {
  calculateActivityByDay,
  convertAmount,
  getCurrentRates,
  getRecentTransactions,
  isExpense,
  isIncome,
  type CurrencyRates,
} from '../../src/utils/dashboard';
import { makeTransaction } from '../helpers/factories';

// Cotizaciones fijas: 1 USD = 1000 ARS = 4000 COP = 0,9 EUR
const RATES: CurrencyRates = { USD: 1, ARS: 1000, COP: 4000, EUR: 0.9 };
const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 0).toISOString();
const NOW = new Date(2026, 9, 29, 18, 0);

describe('getCurrentRates', () => {
  it('toma el dólar como base', () => {
    expect(getCurrentRates().USD).toBe(1);
  });
});

describe('convertAmount', () => {
  it('convierte pasando por el dólar', () => {
    expect(convertAmount(1000, 'ARS', 'USD', RATES)).toBe(1);
    expect(convertAmount(1, 'USD', 'COP', RATES)).toBe(4000);
    expect(convertAmount(4000, 'COP', 'ARS', RATES)).toBe(1000);
  });
});

describe('isIncome e isExpense', () => {
  it('cuentan depósitos y transferencias recibidas como ingreso, y enviadas como gasto', () => {
    expect(isIncome(makeTransaction({ type: 'deposit' }))).toBe(true);
    expect(isIncome(makeTransaction({ type: 'transfer_received' }))).toBe(true);
    expect(isExpense(makeTransaction({ type: 'transfer_sent' }))).toBe(true);
  });

  it('no cuentan el cambio de moneda como ingreso ni como gasto', () => {
    const exchange = makeTransaction({ type: 'exchange' });
    expect(isIncome(exchange)).toBe(false);
    expect(isExpense(exchange)).toBe(false);
  });
});

describe('calculateActivityByDay', () => {
  it('arma un día por posición, del más viejo al de hoy, aunque no haya movimientos', () => {
    const days = calculateActivityByDay([], 'ARS', RATES, NOW, 3);
    expect(days).toEqual([
      { date: '2026-10-27', income: 0, expenses: 0 },
      { date: '2026-10-28', income: 0, expenses: 0 },
      { date: '2026-10-29', income: 0, expenses: 0 },
    ]);
  });

  it('suma ingresos y gastos de cada día en la moneda del usuario', () => {
    const days = calculateActivityByDay(
      [
        makeTransaction({ type: 'deposit', currency: 'ARS', amount: '500.00', created_at: at(29, 9) }),
        makeTransaction({ type: 'deposit', currency: 'USD', amount: '2.00', created_at: at(29, 11) }),
        makeTransaction({ type: 'transfer_sent', currency: 'ARS', amount: '300.00', created_at: at(28, 15) }),
        makeTransaction({ type: 'exchange', currency: 'ARS', amount: '999.00', created_at: at(28, 16) }),
      ],
      'ARS',
      RATES,
      NOW,
      2,
    );

    expect(days).toEqual([
      { date: '2026-10-28', income: 0, expenses: 300 },
      { date: '2026-10-29', income: 2500, expenses: 0 },
    ]);
  });

  it('ignora los movimientos fuera del período', () => {
    const days = calculateActivityByDay(
      [makeTransaction({ amount: '100.00', created_at: at(20, 10) })],
      'ARS',
      RATES,
      NOW,
      7,
    );
    expect(days.every((day) => day.income === 0 && day.expenses === 0)).toBe(true);
  });
});

describe('getRecentTransactions', () => {
  it('ordena del más nuevo al más viejo y corta en el límite, sin modificar la lista original', () => {
    const transactions = [
      makeTransaction({ id: 'vieja', created_at: at(27, 10) }),
      makeTransaction({ id: 'nueva', created_at: at(29, 10) }),
      makeTransaction({ id: 'media', created_at: at(28, 10) }),
    ];

    const recent = getRecentTransactions(transactions, 2);

    expect(recent.map((transaction) => transaction.id)).toEqual(['nueva', 'media']);
    expect(transactions[0].id).toBe('vieja');
  });
});
