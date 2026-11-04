import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TRANSACTIONS_ENABLED } from '../config/features';
import { useAuth } from '../context/auth';
import { ErrorState, LoadingState } from '../components/states';
import Button from '../components/ui/Button';
import {
  TransactionError,
  getTransactions,
  type TransactionFilters,
} from '../services/transactionService';
import { CURRENCY_NAMES, formatMoney } from '../utils/money';
import { isIncome } from '../utils/dashboard';
import {
  formatTransactionDate,
  getTransactionDescription,
  FILTERABLE_TRANSACTION_TYPES,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from '../utils/transactions';
import type { Currency, TransactionPage, TransactionType } from '../types';

const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];
const PAGE_SIZE = 20;

interface HistoryFilters {
  type: TransactionType | '';
  currency: Currency | '';
  from: string; // fecha local del input: "2026-11-04"
  to: string;
  page: number;
}

interface HistoryResult {
  filters: HistoryFilters;
  page?: TransactionPage;
  error?: string;
}

const INITIAL_FILTERS: HistoryFilters = { type: '', currency: '', from: '', to: '', page: 1 };

// El back espera instantes con zona horaria; el día elegido es el del usuario
function toRequest({ type, currency, from, to, page }: HistoryFilters): TransactionFilters {
  return {
    type: type || undefined,
    currency: currency || undefined,
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    page,
    limit: PAGE_SIZE,
  };
}

export default function TransactionHistory() {
  const { logout } = useAuth();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const hasInvertedDates = Boolean(filters.from && filters.to && filters.from > filters.to);

  useEffect(() => {
    if (!TRANSACTIONS_ENABLED || hasInvertedDates) return;
    let ignore = false; // descarta la respuesta si cambiaron los filtros mientras cargaba
    getTransactions(toRequest(filters))
      .then((page) => {
        if (!ignore) setResult({ filters, page });
      })
      .catch((caught: unknown) => {
        if (ignore) return;
        setResult({
          filters,
          error: caught instanceof Error ? caught.message : 'Probá de nuevo.',
        });
        // Token vencido o revocado: sin sesión, ProtectedRoute manda a /login
        if (caught instanceof TransactionError && caught.code === 'UNAUTHORIZED') void logout();
      });
    return () => {
      ignore = true;
    };
  }, [filters, attempt, hasInvertedDates, logout]);

  const current = result?.filters === filters ? result : null;
  const totalPages = current?.page ? Math.max(1, Math.ceil(current.page.total / PAGE_SIZE)) : 1;
  const hasActiveFilters = Boolean(filters.type || filters.currency || filters.from || filters.to);

  // Cambiar un filtro vuelve a la primera página
  function updateFilters(changes: Partial<Omit<HistoryFilters, 'page'>>) {
    setFilters({ ...filters, ...changes, page: 1 });
  }

  function retry() {
    setResult(null);
    setAttempt((value) => value + 1);
  }

  let content;
  if (hasInvertedDates) {
    content = (
      <p className="form-error" role="alert">
        La fecha "Desde" no puede ser posterior a la fecha "Hasta".
      </p>
    );
  } else if (current?.error) {
    content = (
      <ErrorState
        message={`No se pudo cargar el historial de movimientos. ${current.error}`}
        onRetry={retry}
      />
    );
  } else if (!current?.page) {
    content = <LoadingState message="Cargando el historial de movimientos..." />;
  } else if (current.page.items.length === 0) {
    content = hasActiveFilters ? (
      <section className="transaction-history__empty" role="status">
        <h2>No hay movimientos que coincidan</h2>
        <p>Probá con otros filtros para ver tus operaciones.</p>
      </section>
    ) : (
      <section className="transaction-history__empty" role="status">
        <h2>Todavía no hay movimientos</h2>
        <p>Cuando realices operaciones, aparecerán aquí.</p>
      </section>
    );
  } else {
    content = (
      <>
        <ul className="transaction-history__list">
          {current.page.items.map((transaction) => {
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
        {totalPages > 1 && (
          <nav className="transaction-history__pagination" aria-label="Páginas">
            <Button
              variant="solid"
              size="sm"
              outline
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              Anterior
            </Button>
            <span>Página {filters.page} de {totalPages} · {current.page.total} movimientos</span>
            <Button
              variant="solid"
              size="sm"
              outline
              disabled={filters.page >= totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Siguiente
            </Button>
          </nav>
        )}
      </>
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
          {import.meta.env.VITE_USE_MOCK === 'true' && (
            <p className="transaction-history__demo-notice" role="note">
              Modo de pruebas: estos movimientos son datos mock y no representan operaciones reales.
            </p>
          )}
          <section className="transaction-history__filters" aria-label="Filtrar movimientos">
            <label>
              Tipo de movimiento
              <select
                value={filters.type}
                onChange={(event) => updateFilters({ type: event.target.value as HistoryFilters['type'] })}
              >
                <option value="">Todos los tipos</option>
                {FILTERABLE_TRANSACTION_TYPES.map((value) => (
                  <option key={value} value={value}>{TRANSACTION_TYPE_LABELS[value]}</option>
                ))}
              </select>
            </label>
            <label>
              Moneda
              <select
                value={filters.currency}
                onChange={(event) => updateFilters({ currency: event.target.value as HistoryFilters['currency'] })}
              >
                <option value="">Todas las monedas</option>
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>{CURRENCY_NAMES[item]} ({item})</option>
                ))}
              </select>
            </label>
            <label>
              Desde
              <input
                type="date"
                value={filters.from}
                onChange={(event) => updateFilters({ from: event.target.value })}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={filters.to}
                onChange={(event) => updateFilters({ to: event.target.value })}
              />
            </label>
          </section>

          {content}
        </>
      )}
    </main>
  );
}
