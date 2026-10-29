import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TRANSACTIONS_ENABLED } from '../config/features';
import { useWallet } from '../context/wallet';
import { ErrorState, LoadingState } from '../components/states';
import { CURRENCY_NAMES, formatMoney } from '../utils/money';
import { isIncome } from '../utils/dashboard';
import {
  formatTransactionDate,
  getTransactionDescription,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from '../utils/transactions';
import type { Currency, Transaction } from '../types';

const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];

function isWithinDateRange(transaction: Transaction, from: string, to: string): boolean {
  const timestamp = new Date(transaction.created_at).getTime();
  const fromTimestamp = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const toTimestamp = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  return timestamp >= fromTimestamp && timestamp <= toTimestamp;
}

export default function TransactionHistory() {
  const wallet = useWallet();
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const transactions = useMemo(
    () =>
      [...wallet.transactions]
        .filter((transaction) =>
          (!type || transaction.type === type) &&
          (!currency || transaction.currency === currency) &&
          isWithinDateRange(transaction, from, to),
        )
        .sort(
          (first, second) =>
            new Date(second.created_at).getTime() -
            new Date(first.created_at).getTime(),
        ),
    [currency, from, to, type, wallet.transactions],
  );

  if (wallet.isLoading) {
    return (
      <main className="transaction-history">
        <LoadingState message="Cargando el historial de movimientos..." />
      </main>
    );
  }

  if (wallet.error) {
    return (
      <main className="transaction-history">
        <ErrorState
          message={`No se pudo cargar el historial de movimientos. ${wallet.error}`}
          onRetry={() => void wallet.reload()}
        />
      </main>
    );
  }

  return (
    <main className="transaction-history" aria-labelledby="transaction-history-title">
      <header className="transaction-history__header">
        <div>
          <p className="dashboard__eyebrow">Tu billetera</p>
          <h1 id="transaction-history-title">Historial de movimientos</h1>
          <p className="transaction-history__intro">
            Consultá los movimientos de tu billetera, del más reciente al más antiguo.
          </p>
        </div>
        <Link className="transaction-history__back-link" to="/dashboard">
          Volver a mi billetera
        </Link>
      </header>

      {!TRANSACTIONS_ENABLED ? (
        <section className="transaction-history__notice" role="status">
          <h2>Historial no disponible todavía</h2>
          <p>
            El backend aún no ofrece el endpoint de movimientos. Cuando esté disponible,
            podrás consultar aquí las operaciones reales de tu cuenta.
          </p>
        </section>
      ) : (
        <>
          <p className="transaction-history__demo-notice" role="note">
            Modo de pruebas: estos movimientos son datos mock y no representan operaciones reales.
          </p>
          <section className="transaction-history__filters" aria-label="Filtrar movimientos">
            <label>
              Tipo de movimiento
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="">Todos los tipos</option>
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Moneda
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="">Todas las monedas</option>
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>{CURRENCY_NAMES[item]} ({item})</option>
                ))}
              </select>
            </label>
            <label>
              Desde
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label>
              Hasta
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
          </section>

          {wallet.transactions.length === 0 ? (
            <section className="transaction-history__empty" role="status">
              <h2>Todavía no hay movimientos</h2>
              <p>Cuando realices operaciones, aparecerán aquí.</p>
            </section>
          ) : transactions.length === 0 ? (
            <section className="transaction-history__empty" role="status">
              <h2>No hay movimientos que coincidan</h2>
              <p>Probá con otros filtros para ver tus operaciones.</p>
            </section>
          ) : (
            <ul className="transaction-history__list">
              {transactions.map((transaction) => {
                const income = isIncome(transaction);
                const isExchange = Boolean(transaction.exchange);
                const amountClass = isExchange
                  ? 'transaction-history__amount transaction-history__amount--neutral'
                  : income
                    ? 'transaction-history__amount transaction-history__amount--income'
                    : 'transaction-history__amount';

                return (
                  <li className="transaction-history__item" key={transaction.id}>
                    <span
                      className={`transaction-history__icon${income ? ' transaction-history__icon--income' : isExchange ? ' transaction-history__icon--neutral' : ''}`}
                      aria-hidden="true"
                    >
                      {isExchange ? '⇄' : income ? '↓' : '↑'}
                    </span>
                    <div className="transaction-history__details">
                      <strong>{getTransactionDescription(transaction)}</strong>
                      <span>
                        {TRANSACTION_TYPE_LABELS[transaction.type]} · {formatTransactionDate(transaction.created_at)}
                      </span>
                    </div>
                    <div className="transaction-history__value">
                      <strong className={amountClass}>
                        {income ? '+' : '−'}{formatMoney(transaction.amount, transaction.currency)}
                      </strong>
                      {transaction.exchange && (
                        <span className="transaction-history__exchange">
                          +{formatMoney(transaction.exchange.to_amount, transaction.exchange.to_currency)}
                        </span>
                      )}
                    </div>
                    <span className={`transaction-history__status transaction-history__status--${transaction.status}`}>
                      {TRANSACTION_STATUS_LABELS[transaction.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
