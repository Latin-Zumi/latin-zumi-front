export type Currency = 'ARS' | 'COP' | 'USD' | 'EUR';

export interface Balance {
  wallet_id: number;
  currency: Currency;
  amount: string; // NUMERIC(20,8) llega como string desde Postgres
}

export type WalletTransactionType = 'income' | 'expense' | 'transfer';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  currency: Currency;
  amount: string;
  occurredAt: string;
  description: string;
  recipient?: string;
}