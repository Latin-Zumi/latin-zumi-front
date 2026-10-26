export type Currency = 'ARS' | 'COP' | 'USD' | 'EUR';

export interface Balance {
  wallet_id: number;
  currency: Currency;
  amount: string; // NUMERIC(20,8) llega como string desde Postgres
}