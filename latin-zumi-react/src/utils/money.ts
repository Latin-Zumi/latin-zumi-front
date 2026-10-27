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
// Los montos se suman y comparan en centavos enteros para evitar errores de redondeo
// (0.1 + 0.2 = 0.30000000000000004). Solo se pasan a string para mostrar o enviar.
export function toCents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Acepta "1500", "1500.5" o "1500,50". Devuelve los centavos, o null si no es un monto válido.
export function parseAmountInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = toCents(normalized);
  return cents > 0 && Number.isSafeInteger(cents) ? cents : null;
}
