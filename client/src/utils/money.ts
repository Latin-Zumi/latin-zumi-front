import type { Balance, Currency, Rates, Transaction } from '../types';

/** Unidades de `currency` por 1 unidad de la moneda base. */
export function getRate(rates: Rates, currency: Currency): number {
  if (currency === rates.base) return 1;
  const rate = rates.values[currency];
  if (rate === undefined) {
    throw new Error(`No hay tasa para ${currency}`);
  }
  return rate;
}

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Rates,
): number {
  return (amount / getRate(rates, from)) * getRate(rates, to);
}

/** Suma todos los balances expresados en la moneda `target`. */
export function getUnifiedBalance(
  balances: Balance[],
  target: Currency,
  rates: Rates,
): number {
  return balances.reduce(
    (total, b) => total + convert(Number(b.amount), b.currency, target, rates),
    0,
  );
}

export function formatMoney(amount: number | string, currency: Currency): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(Number(amount));
}

/**
 * Moneda "principal" de una transacción. Cubre el caso del depósito
 * mientras el back define si va en from_currency o to_currency.
 */
export function getMainCurrency(tx: Transaction): Currency | null {
  return tx.to_currency ?? tx.from_currency;
}