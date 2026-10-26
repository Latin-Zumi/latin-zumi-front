import type { Currency } from '../types';

export const CURRENCY_NAMES: Record<Currency, string> = {
  ARS: 'Peso argentino',
  COP: 'Peso colombiano',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
};

export function formatMoney(amount: string | number, currency: Currency): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(Number(amount));
}