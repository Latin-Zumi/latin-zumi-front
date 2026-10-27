import { useEffect, useState, type ReactNode } from 'react';
import { WalletContext } from './wallet-context';
import { useAuth } from '../hooks/useAuth';
import {
  TransactionError,
  getTransactions,
  transfer as transferService,
  type TransferData,
} from '../services/transactionService';
import { WalletError, getBalances } from '../services/walletService';
import type { Balance, Transaction } from '../types';

const RECENT_LIMIT = 20;

interface WalletData {
  email: string; // a qué usuario pertenecen los datos
  balances: Balance[];
  transactions: Transaction[];
  error: string;
}

async function fetchWallet(email: string): Promise<WalletData> {
  try {
    const [balances, page] = await Promise.all([
      getBalances(),
      getTransactions({ limit: RECENT_LIMIT }),
    ]);
    return { email, balances, transactions: page.items, error: '' };
  } catch (error) {
    return {
      email,
      balances: [],
      transactions: [],
      error:
        error instanceof WalletError || error instanceof TransactionError
          ? error.message
          : 'No pudimos cargar tu billetera. Probá de nuevo.',
    };
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const email = user?.email ?? null;
  const [data, setData] = useState<WalletData | null>(null);

  useEffect(() => {
    if (!email) return;
    let ignore = false; // descarta la respuesta si el usuario cambió mientras cargaba
    void fetchWallet(email).then((next) => {
      if (!ignore) setData(next);
    });
    return () => {
      ignore = true;
    };
  }, [email]);

  // Si cambió el usuario, los datos anteriores no se muestran mientras cargan los nuevos
  const current = data && data.email === email ? data : null;

  const reload = async () => {
    if (email) setData(await fetchWallet(email));
  };

  const transfer = async (transferData: TransferData, idempotencyKey: string) => {
    const result = await transferService(transferData, idempotencyKey);
    setData((previous) =>
      previous && {
        ...previous,
        balances: result.balances,
        // Un reintento con la misma Idempotency-Key devuelve el mismo movimiento: no se repite
        transactions: [
          result.transaction,
          ...previous.transactions.filter(({ id }) => id !== result.transaction.id),
        ],
      },
    );
    return result.transaction;
  };

  return (
    <WalletContext.Provider
      value={{
        balances: current?.balances ?? [],
        transactions: current?.transactions ?? [],
        isLoading: Boolean(email) && !current,
        error: current?.error ?? '',
        reload,
        transfer,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
