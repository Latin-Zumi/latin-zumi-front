import type { Balance, Currency } from '../../types';
import { formatMoney, fromCents, getAvailableAmount, toCents } from '../../utils/money';

interface AvailableBalanceProps {
  // Se asocia al campo de monto con aria-describedby para que el lector lo lea al entrar
  id: string;
  currency: Currency;
  balances: Balance[];
  onUseAll: (amount: string) => void;
}

export default function AvailableBalance({ id, currency, balances, onUseAll }: AvailableBalanceProps) {
  const available = getAvailableAmount(balances, currency);
  const hasFunds = toCents(available) > 0;

  return (
    <p className="available-balance">
      <span id={id}>
        Disponible: <strong>{formatMoney(available, currency)}</strong>
      </span>
      {hasFunds && (
        <button
          type="button"
          className="available-balance__use-all"
          onClick={() => onUseAll(fromCents(toCents(available)).replace('.', ','))}
        >
          Usar todo
        </button>
      )}
    </p>
  );
}
