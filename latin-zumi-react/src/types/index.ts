export type Currency = 'ARS' | 'COP' | 'USD' | 'EUR';

// Una cuenta de GET /accounts, con los nombres que usa el front
export interface Balance {
  account_id: string; // accounts[].id (UUID)
  wallet_id: string; // accounts[].wallet_id (UUID)
  currency: Currency;
  amount: string; // accounts[].balance: NUMERIC llega como string, por ejemplo "1200.50000000"
}

// Contrato acordado en docs/specs/2026-10-27-Transacciones-contrato-y-mock.md
export type TransactionType =
  | 'deposit'
  | 'transfer_sent'
  | 'transfer_received'
  | 'exchange';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  currency: Currency;
  amount: string;
  created_at: string;
  description: string;
  counterparty?: { nombre: string; email: string };
  exchange?: { to_currency: Currency; to_amount: string; rate: string };
}

export interface TransactionPage {
  items: Transaction[];
  page: number;
  total: number;
}

// Lo que devuelven transferencias, depósitos y cambios de moneda
export interface OperationResult {
  transaction: Transaction;
  balances: Balance[];
}

export interface ExchangeQuote {
  quote_id: string;
  rate: string;
  to_amount: string;
  expires_at: string;
}

export type TransactionErrorCode =
  | 'INVALID_AMOUNT'
  | 'UNAUTHORIZED'
  | 'RECIPIENT_NOT_FOUND'
  | 'QUOTE_EXPIRED'
  | 'INSUFFICIENT_FUNDS'
  | 'SELF_TRANSFER'
  | 'CONNECTION'
  | 'UNKNOWN';
