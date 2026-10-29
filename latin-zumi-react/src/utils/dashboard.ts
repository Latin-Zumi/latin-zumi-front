import { getRateHistory } from '../services/ratesService';
import type { Currency, Transaction } from '../types';
import { toCents } from './money';

export interface ActivityDay {
  date: string;
  income: number;
  expenses: number;
}

export type CurrencyRates = Record<Currency, number>;

export function getCurrentRates(): CurrencyRates {
  return {
    USD: 1,
    ARS: getRateHistory('ARS', 1)[0].value,
    COP: getRateHistory('COP', 1)[0].value,
    EUR: getRateHistory('EUR', 1)[0].value,
  };
}

// Las conversiones entre monedas son estimadas (cotizaciones simuladas), solo para mostrar
export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: CurrencyRates,
): number {
  return (amount / rates[from]) * rates[to];
}

export function isIncome(transaction: Transaction): boolean {
  return transaction.type === 'deposit' || transaction.type === 'transfer_received';
}

// El cambio de moneda mueve plata entre tus saldos: no cuenta como ingreso ni como gasto
export function isExpense(transaction: Transaction): boolean {
  return transaction.type === 'transfer_sent';
}

function convertTransaction(
  transaction: Transaction,
  preferredCurrency: Currency,
  rates: CurrencyRates,
): number {
  return convertAmount(
    toCents(transaction.amount) / 100,
    transaction.currency,
    preferredCurrency,
    rates,
  );
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateActivityByDay(
  transactions: Transaction[],
  preferredCurrency: Currency,
  rates: CurrencyRates,
  now: Date,
  days: number,
): ActivityDay[] {
  const result = Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - index - 1));
    return { date: localDateKey(date), income: 0, expenses: 0 };
  });

  for (const transaction of transactions) {
    const dateKey = localDateKey(new Date(transaction.created_at));
    const day = result.find((item) => item.date === dateKey);
    if (!day) continue;

    const amount = convertTransaction(transaction, preferredCurrency, rates);
    if (isIncome(transaction)) day.income += amount;
    else if (isExpense(transaction)) day.expenses += amount;
  }

  return result;
}

export function getRecentTransactions(
  transactions: Transaction[],
  limit: number,
): Transaction[] {
  return [...transactions]
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    )
    .slice(0, limit);
}
