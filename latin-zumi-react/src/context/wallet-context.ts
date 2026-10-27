import { createContext } from 'react';
import type { DepositData, TransferData } from '../services/transactionService';
import type { Balance, Transaction } from '../types';

export interface WalletContextValue {
  balances: Balance[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string;
  reload: () => Promise<void>;
  transfer: (data: TransferData, idempotencyKey: string) => Promise<Transaction>;
  deposit: (data: DepositData, idempotencyKey: string) => Promise<Transaction>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);
