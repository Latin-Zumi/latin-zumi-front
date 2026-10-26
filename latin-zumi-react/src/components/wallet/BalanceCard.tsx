import type { Balance } from '../../types';
import { CURRENCY_NAMES, formatMoney } from '../../utils/money';

interface BalanceCardProps {
  balance: Balance;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const { currency, amount } = balance;

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="rounded-md bg-background px-3 py-1 text-xs font-bold text-foreground">
          {currency}
        </span>
        <h3 className="text-sm font-medium text-muted">
          {CURRENCY_NAMES[currency]}
        </h3>
      </div>
      <p className="mt-4 text-2xl font-bold text-foreground">
        {formatMoney(amount, currency)}
      </p>
    </article>
  );
}