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
