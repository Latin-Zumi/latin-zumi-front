import type { Balance } from '../../types';
import { CURRENCY_NAMES, formatMoney } from '../../utils/money';

interface BalanceTableProps {
  balances: Balance[];
}

export default function BalanceTable({ balances }: BalanceTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Balances por moneda</caption>
        <thead>
          <tr className="border-b border-border text-muted">
            <th scope="col" className="px-4 py-3 font-medium">
              Moneda
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Nombre
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Saldo
            </th>
          </tr>
        </thead>
        <tbody>
          {balances.map((balance) => (
            <tr
              key={balance.currency}
              className="border-b border-border last:border-0"
            >
              <td className="px-4 py-3 font-bold">{balance.currency}</td>
              <td className="px-4 py-3 text-muted">
                {CURRENCY_NAMES[balance.currency]}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatMoney(balance.amount, balance.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}