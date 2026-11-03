import { CURRENCY_NAMES } from './money';
import type { Currency } from '../types';

export const MAX_SPREAD_PERCENT = 10;
export const MAX_INTEREST_PERCENT = 50;

const PERCENT = /^\d{1,3}(?:[.,]\d{1,2})?$/;

// "1,5" o "1.5" → "1.50", el formato del backend. Devuelve null si no es válido o supera el máximo.
export function parsePercentInput(value: string, max: number): string | null {
  const text = value.trim();
  if (!PERCENT.test(text)) return null;
  const percent = Number(text.replace(',', '.'));
  return percent <= max ? percent.toFixed(2) : null;
}

export function formatPercent(value: string): string {
  const number = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
  return `${number} %`;
}

// Para mostrar en el formulario lo que guardó el backend: "1.50" → "1,50"
export function toPercentInput(value: string): string {
  return Number(value).toFixed(2).replace('.', ',');
}

// Nombre legible del campo que cambió en el historial
export function getSettingLabel(field: string): string {
  if (field === 'exchange_spread_percent') return 'Comisión de los cambios';
  const currency = field.replace('interest_rates.', '') as Currency;
  return `Interés anual en ${CURRENCY_NAMES[currency] ?? currency}`;
}

export const USER_STATUS_LABELS: Record<string, string> = {
  activo: 'Activo',
  bloqueado: 'Bloqueado',
};
