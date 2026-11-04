import { formatMoney } from '../utils/money';
import { getMockBalances } from './wallets';

// Simula POST /chat/messages: responde con los saldos del usuario, sin inteligencia artificial
export function getMockChatReply(email: string, message: string): string {
  if (!/saldo|tengo|plata|billetera|balance/i.test(message)) {
    return 'Modo de pruebas: puedo contarte cuánto tenés en tu billetera. Probá preguntándome por tus saldos.';
  }

  const balances = getMockBalances(email);
  if (!balances.ok) return 'No pude leer tus saldos.';

  const summary = balances.data
    .map(({ amount, currency }) => `${currency}: ${formatMoney(amount, currency)}`)
    .join('\n');
  return `Modo de pruebas: estos son tus saldos.\n${summary}`;
}
