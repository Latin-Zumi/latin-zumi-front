import type { Balance, Currency } from '../types';

export const CURRENCY_NAMES: Record<Currency, string> = {
  ARS: 'Peso argentino',
  COP: 'Peso colombiano',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
};

export function formatMoney(amount: string | number, currency: Currency): string {
  const value = Number(amount);
  // El peso colombiano se muestra sin decimales y redondearía "1.250.000,50" a "1.250.001".
  // Si el monto tiene centavos se muestran siempre; si no, cada moneda usa su formato.
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    ...(hasCents && { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }).format(value);
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

// Muestra el tipo de cambio en el sentido en que la cifra es mayor a 1:
// "1 USD = 1.445,00 ARS" se lee mejor que "1 ARS = 0,0007 USD"
export function formatExchangeRate(from: Currency, to: Currency, rate: number): string {
  const [base, quote, value] = rate >= 1 ? [from, to, rate] : [to, from, 1 / rate];
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 10 ? 4 : 2,
  }).format(value);
  return `1 ${base} = ${formatted} ${quote}`;
}

export function getAvailableAmount(balances: Balance[], currency: Currency): string {
  return balances.find((balance) => balance.currency === currency)?.amount ?? '0';
}

// Avisa mientras se escribe si el monto supera lo disponible. Un monto mal escrito lo valida el formulario al enviar.
export function getInsufficientFundsError(value: string, available: string): string | undefined {
  const cents = parseAmountInput(value);
  return cents !== null && cents > toCents(available)
    ? 'No tenés saldo suficiente en esa moneda.'
    : undefined;
}
