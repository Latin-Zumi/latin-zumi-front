import mockData from '../mocks/mock-user-wallet.json';
import type {
  Balance,
  Currency,
  MockData,
  Rates,
  Transaction,
  TransactionType,
  User,
} from '../types';

const data = mockData as unknown as MockData;

// Simula la latencia de la API real
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export interface TransactionFilters {
  type?: TransactionType;
  currency?: Currency;
}

export async function getUser(): Promise<User> {
  await delay();
  return structuredClone(data.user);
}

export async function getBalances(): Promise<Balance[]> {
  await delay();
  return structuredClone(data.balances);
}

export async function getRates(): Promise<Rates> {
  await delay();
  return structuredClone(data.rates);
}

export async function getTransactions(
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  await delay();
  const { type, currency } = filters;

  return structuredClone(data.transactions)
    .filter((tx) => !type || tx.type === type)
    .filter(
      (tx) =>
        !currency || tx.from_currency === currency || tx.to_currency === currency,
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}