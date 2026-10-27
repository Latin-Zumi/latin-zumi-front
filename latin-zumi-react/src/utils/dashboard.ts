import { getRateHistory } from '../services/ratesService';
import type { Balance, Currency, WalletTransaction } from '../types';

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

export function calculateBalances(
  openingBalances: Balance[],
  transactions: WalletTransaction[],
): Balance[] {
  return openingBalances.map((balance) => {
    const netTransactions = transactions.reduce((total, transaction) => {
      if (transaction.currency !== balance.currency) return total;
      const amount = Number(transaction.amount);
      return total + (transaction.type === 'income' ? amount : -amount);
    }, 0);

    return {
      ...balance,
      amount: (Number(balance.amount) + netTransactions).toFixed(2),
    };
  });
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: CurrencyRates,
): number {
  return (amount / rates[from]) * rates[to];
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateSpentToday(
  transactions: WalletTransaction[],
  preferredCurrency: Currency,
  rates: CurrencyRates,
  now: Date,
): number {
  const today = localDateKey(now);

  return transactions.reduce((total, transaction) => {
    if (
      transaction.type === 'income' ||
      localDateKey(new Date(transaction.occurredAt)) !== today
    ) {
      return total;
    }

    return total + convertAmount(
      Number(transaction.amount),
      transaction.currency,
      preferredCurrency,
      rates,
    );
  }, 0);
}

export function calculateActivityByDay(
  transactions: WalletTransaction[],
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
    const dateKey = localDateKey(new Date(transaction.occurredAt));
    const day = result.find((item) => item.date === dateKey);
    if (!day) continue;

    const amount = convertAmount(
      Number(transaction.amount),
      transaction.currency,
      preferredCurrency,
      rates,
    );
    if (transaction.type === 'income') day.income += amount;
    else day.expenses += amount;
  }

  return result;
}

export function getRecentTransactions(
  transactions: WalletTransaction[],
  limit: number,
): WalletTransaction[] {
  return [...transactions]
    .sort(
      (first, second) =>
        new Date(second.occurredAt).getTime() -
        new Date(first.occurredAt).getTime(),
    )
    .slice(0, limit);
}
