import type { Transaction, TransactionStatus, TransactionType } from '../types';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Depósito',
  transfer_sent: 'Transferencia enviada',
  transfer_received: 'Transferencia recibida',
  exchange: 'Cambio de moneda',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  failed: 'Fallido',
};

export function formatTransactionDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getTransactionDescription(transaction: Transaction): string {
  return transaction.counterparty?.nombre ?? transaction.description;
}

export function formatTransactionTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { timeStyle: 'short' }).format(new Date(value));
}

export interface TransactionDayGroup {
  key: string;
  label: string;
  transactions: Transaction[];
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Agrupa por día local, manteniendo el orden recibido: "Hoy", "Ayer" o el día de la semana con fecha
export function groupTransactionsByDay(
  transactions: Transaction[],
  now: Date,
): TransactionDayGroup[] {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups: TransactionDayGroup[] = [];

  for (const transaction of transactions) {
    const date = new Date(transaction.created_at);
    const key = dayKey(date);
    let group = groups.find((item) => item.key === key);
    if (!group) {
      const label =
        key === dayKey(now)
          ? 'Hoy'
          : key === dayKey(yesterday)
            ? 'Ayer'
            : new Intl.DateTimeFormat('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              }).format(date);
      group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), transactions: [] };
      groups.push(group);
    }
    group.transactions.push(transaction);
  }

  return groups;
}
