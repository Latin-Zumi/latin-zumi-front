import { useEffect, useState, type ReactNode } from 'react';
import { WalletContext } from './WalletContext';
import { useAuth } from '../auth';
import {
  TransactionError,
  deposit as depositService,
  exchange as exchangeService,
  getTransactions,
  transfer as transferService,
  type DepositData,
  type TransferData,
} from '../../services/transactionService';
import { TRANSACTIONS_ENABLED } from '../../config/features';
import {
  WalletError,
  WalletSessionExpiredError,
  getBalances,
} from '../../services/walletService';
import type { Balance, OperationResult, Transaction } from '../../types';

const RECENT_LIMIT = 20;

interface WalletData {
  email: string; // a qué usuario pertenecen los datos
  balances: Balance[];
  transactions: Transaction[];
  error: string;
  sessionExpired: boolean;
}

async function fetchWallet(email: string): Promise<WalletData> {
  try {
    // Sin backend de movimientos todavía: con la API real solo se piden los saldos
    const [balances, page] = await Promise.all([
      getBalances(),
      TRANSACTIONS_ENABLED ? getTransactions({ limit: RECENT_LIMIT }) : null,
    ]);
    return { email, balances, transactions: page?.items ?? [], error: '', sessionExpired: false };
  } catch (error) {
    return {
      email,
      balances: [],
      transactions: [],
      sessionExpired:
        error instanceof WalletSessionExpiredError ||
        (error instanceof TransactionError && error.code === 'UNAUTHORIZED'),
      error:
        error instanceof WalletError || error instanceof TransactionError
          ? error.message
          : 'No pudimos cargar tu billetera. Probá de nuevo.',
    };
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const email = user?.email ?? null;
  const [data, setData] = useState<WalletData | null>(null);

  useEffect(() => {
    if (!email) return;
    let ignore = false; // descarta la respuesta si el usuario cambió mientras cargaba
    void fetchWallet(email).then((next) => {
      if (ignore) return;
      setData(next);
      // Token vencido o revocado: sin sesión, ProtectedRoute manda a /login
      if (next.sessionExpired) void logout();
    });
    return () => {
      ignore = true;
    };
  }, [email, logout]);

  // Si cambió el usuario, los datos anteriores no se muestran mientras cargan los nuevos
  const current = data && data.email === email ? data : null;

  const reload = async () => {
    if (!email) return;
    const next = await fetchWallet(email);
    setData(next);
    if (next.sessionExpired) await logout();
  };

  // Cada operación devuelve los saldos actualizados y el movimiento creado
  const applyResult = (result: OperationResult) => {
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

  const transfer = async (transferData: TransferData, idempotencyKey: string) =>
    applyResult(await transferService(transferData, idempotencyKey));

  const deposit = async (depositData: DepositData, idempotencyKey: string) =>
    applyResult(await depositService(depositData, idempotencyKey));

  const exchange = async (quoteId: string, idempotencyKey: string) =>
    applyResult(await exchangeService(quoteId, idempotencyKey));

  return (
    <WalletContext.Provider
      value={{
        balances: current?.balances ?? [],
        transactions: current?.transactions ?? [],
        isLoading: Boolean(email) && !current,
        error: current?.error ?? '',
        reload,
        transfer,
        deposit,
        exchange,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
