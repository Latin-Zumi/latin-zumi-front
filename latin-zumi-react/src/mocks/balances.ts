import type { AuthUser } from '../services/authService';
import type { Balance, Currency, WalletTransaction } from '../types';
import { calculateBalances } from '../utils/dashboard';

const dateDaysAgo = (days: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

interface MockWallet {
  user: AuthUser;
  openingBalances: Balance[];
  transactions: WalletTransaction[];
}

export const mockWallet: MockWallet = {
  user: {
    id: 1,
    nombre: 'Valentina',
    email: 'valentina@latinzumi.test',
    pais: 'Argentina',
    moneda_preferida: 'ARS',
    roles: ['user'],
    estado: 'activo',
  },
  openingBalances: [
    { wallet_id: 1, currency: 'ARS', amount: '110200.00' },
    { wallet_id: 1, currency: 'COP', amount: '1392000.00' },
    { wallet_id: 1, currency: 'USD', amount: '1035.50' },
    { wallet_id: 1, currency: 'EUR', amount: '868.75' },
  ],
  transactions: [
    {
      id: 'mock-income-ars',
      type: 'income',
      currency: 'ARS',
      amount: '35000.00',
      occurredAt: dateDaysAgo(4, 10),
      description: 'Ingreso recibido',
    },
    {
      id: 'mock-expense-ars',
      type: 'expense',
      currency: 'ARS',
      amount: '8000.00',
      occurredAt: dateDaysAgo(4, 15),
      description: 'Compra con tarjeta',
    },
    {
      id: 'mock-income-usd',
      type: 'income',
      currency: 'USD',
      amount: '200.00',
      occurredAt: dateDaysAgo(3, 11),
      description: 'Ingreso recibido',
    },
    {
      id: 'mock-expense-usd',
      type: 'expense',
      currency: 'USD',
      amount: '35.00',
      occurredAt: dateDaysAgo(2, 14),
      description: 'Suscripción',
    },
    {
      id: 'mock-transfer-cop',
      type: 'transfer',
      currency: 'COP',
      amount: '42000.00',
      occurredAt: dateDaysAgo(1, 16),
      description: 'Transferencia enviada',
      recipient: 'Mateo',
    },
    {
      id: 'mock-expense-eur',
      type: 'expense',
      currency: 'EUR',
      amount: '18.00',
      occurredAt: dateDaysAgo(0, 9),
      description: 'Café',
    },
  ],
};

export const mockBalances = calculateBalances(
  mockWallet.openingBalances,
  mockWallet.transactions,
);

export const MOCK_CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];