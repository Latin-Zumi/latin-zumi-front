import type { Transaction } from '../../src/types';

// Arma una transacción válida; cada test cambia solo lo que le importa
export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: crypto.randomUUID(),
    type: 'deposit',
    status: 'completed',
    currency: 'ARS',
    amount: '100.00',
    created_at: new Date(2026, 9, 29, 10, 0).toISOString(),
    description: 'Depósito',
    ...overrides,
  };
}

// Intl separa símbolo y número con un espacio especial (no separable); así se compara fácil
export function normalizeSpaces(value: string): string {
  return value.replace(/\s/gu, ' ');
}
