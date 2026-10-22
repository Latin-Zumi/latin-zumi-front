export type Currency = 'ARS' | 'COP' | 'USD' | 'EUR';

export type TransactionType = 'deposit' | 'buy' | 'sell' | 'exchange';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface User {
  id: number;
  nombre: string;
  email: string;
  pais: string;
  moneda_preferida: Currency;
  fecha_registro: string;
  roles: string[];
  estado: string;
  auth_token: string;
}

export interface Balance {
  wallet_id: number;
  currency: Currency;
  amount: string; // NUMERIC(20,8) llega como string
}

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  from_currency: Currency | null;
  to_currency: Currency | null;
  from_amount: string | null;
  to_amount: string | null;
  rate_applied: string | null;
  status: TransactionStatus;
  created_at: string;
}

export interface Rates {
  base: Currency;
  updated_at: string;
  values: Partial<Record<Currency, number>>;
}

export interface MockData {
  user: User;
  balances: Balance[];
  transactions: Transaction[];
  rates: Rates;
}