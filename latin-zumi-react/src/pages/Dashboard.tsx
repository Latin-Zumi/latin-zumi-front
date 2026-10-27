import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import ActivityChart from '../components/ActivityChart';
import { EmptyState, ErrorState } from '../components/states';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import BalanceCard from '../components/wallet/BalanceCard';
import BalanceTable from '../components/wallet/BalanceTable';
import { useAuth } from '../hooks/useAuth';
import { mockWallet } from '../mocks/balances';
import {
  calculateActivityByDay,
  calculateBalances,
  calculateSpentToday,
  convertAmount,
  getCurrentRates,
  getRecentTransactions,
} from '../utils/dashboard';
import { CURRENCY_NAMES, formatMoney } from '../utils/money';
import type { Currency, WalletTransaction } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];

const transferSchema = z.object({
  currency: z.enum(CURRENCIES),
  amount: z.string()
    .trim()
    .min(1, 'Ingresá un monto.')
    .refine((value) => {
      const amount = Number(value);
      return Number.isFinite(amount) && amount > 0;
    }, 'El monto debe ser mayor a cero.')
    .refine((value) => {
      const amount = Number(value);
      return Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
    }, 'Usá hasta dos decimales.'),
  recipient: z.string().trim().min(2, 'Ingresá un destinatario.'),
});

function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((currency) => currency === value);
}

function formatTransactionDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function Dashboard() {
  const { user: authenticatedUser } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>(
    () => mockWallet.transactions,
  );
  const [transferOpen, setTransferOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const user = USE_MOCK ? mockWallet.user : authenticatedUser;

  if (!user) {
    return <ErrorState message="No pudimos cargar los datos de tu usuario." />;
  }

  if (!isCurrency(user.moneda_preferida)) {
    return <ErrorState message="Tu moneda preferida no es válida." />;
  }

  const preferredCurrency = user.moneda_preferida;
  const rates = getCurrentRates();
  const balances = calculateBalances(mockWallet.openingBalances, transactions);
  const totalBalance = balances.reduce(
    (total, balance) =>
      total + convertAmount(
        Number(balance.amount),
        balance.currency,
        preferredCurrency,
        rates,
      ),
    0,
  );
  const spentToday = calculateSpentToday(
    transactions,
    preferredCurrency,
    rates,
    new Date(),
  );
  const activityByDay = calculateActivityByDay(
    transactions,
    preferredCurrency,
    rates,
    new Date(),
    5,
  );
  const recentTransactions = getRecentTransactions(transactions, 5);

  function closeTransfer() {
    setTransferOpen(false);
    setFormError('');
  }

  function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = transferSchema.safeParse({
      currency: formData.get('currency'),
      amount: formData.get('amount'),
      recipient: formData.get('recipient'),
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revisá los datos ingresados.');
      return;
    }

    const amount = Number(result.data.amount);
    const balance = balances.find(
      (item) => item.currency === result.data.currency,
    );
    if (!balance || amount > Number(balance.amount)) {
      setFormError('No tenés saldo suficiente en esa moneda.');
      return;
    }

    const transaction: WalletTransaction = {
      id: `transfer-${transactions.length + 1}`,
      type: 'transfer',
      currency: result.data.currency,
      amount: amount.toFixed(2),
      occurredAt: new Date().toISOString(),
      description: 'Transferencia enviada',
      recipient: result.data.recipient,
    };
    setTransactions((current) => [transaction, ...current]);
    closeTransfer();
  }

  return (
    <main className="dashboard">
      <section className="home-hero dashboard-hero" aria-labelledby="dashboard-title">
        <div className="home-hero__text">
          <p className="home-hero__eyebrow">Resumen de tu billetera</p>
          <h1 id="dashboard-title">¡Hola, {user.nombre}!</h1>
          <p className="home-hero__lead">
            Saldo total en {CURRENCY_NAMES[preferredCurrency]}
          </p>
          <p className="dashboard-hero__balance">
            {formatMoney(totalBalance, preferredCurrency)}
          </p>
        </div>
        <div className="home-hero__actions">
          <Button variant="solid" size="lg" onClick={() => setTransferOpen(true)}>
            Transferir
          </Button>
        </div>
      </section>

      <section className="dashboard__balances" aria-labelledby="balances-title">
        <div className="dashboard__section-heading">
          <div>
            <p className="dashboard__eyebrow">Tus monedas</p>
            <h2 id="balances-title">Saldos disponibles</h2>
          </div>
        </div>
        <div className="dashboard__balance-grid">
          {balances.map((balance) => (
            <BalanceCard key={balance.currency} balance={balance} />
          ))}
        </div>
        <details className="dashboard__balances-table">
          <summary>Ver saldos como tabla</summary>
          <BalanceTable balances={balances} />
        </details>
      </section>

      <div className="dashboard__content">
        <section
          className="panel dashboard__analytics"
          aria-labelledby="activity-title"
        >
          <header className="dashboard__section-heading">
            <div>
              <p className="dashboard__eyebrow">Últimos cinco días</p>
              <h2 id="activity-title">Actividad de tu dinero</h2>
            </div>
            <div className="dashboard__spent">
              <span>Gastado hoy</span>
              <strong>{formatMoney(spentToday, preferredCurrency)}</strong>
            </div>
          </header>
          <ActivityChart data={activityByDay} currency={preferredCurrency} />
        </section>

        <aside
          className="panel dashboard__account"
          aria-label="Resumen y actividad reciente"
        >
          <section className="dashboard__profile" aria-labelledby="profile-title">
            <p className="dashboard__eyebrow">Tu cuenta</p>
            <h2 id="profile-title">{user.nombre}</h2>
            <p className="dashboard__email">{user.email}</p>
            <span className="dashboard__currency-tag">
              {CURRENCY_NAMES[preferredCurrency]}
            </span>
            <p className="dashboard__account-total">
              {formatMoney(totalBalance, preferredCurrency)}
            </p>
            <span className="dashboard__muted">Saldo total unificado</span>
          </section>

          <section className="dashboard__recent" aria-labelledby="recent-title">
            <div className="dashboard__section-heading">
              <h2 id="recent-title">Actividad reciente</h2>
            </div>
            {recentTransactions.length === 0 ? (
              <EmptyState
                title="Todavía no hay movimientos"
                description="Tus ingresos y gastos aparecerán acá."
                variant="no-transactions"
              />
            ) : (
              <ul className="dashboard__movement-list">
                {recentTransactions.map((transaction) => {
                  const isIncome = transaction.type === 'income';
                  const typeLabel = isIncome
                    ? 'Ingreso'
                    : transaction.type === 'transfer'
                      ? 'Transferencia'
                      : 'Gasto';
                  return (
                    <li className="dashboard__movement" key={transaction.id}>
                      <span
                        className={`dashboard__movement-icon${isIncome ? ' dashboard__movement-icon--income' : ''}`}
                        aria-hidden="true"
                      >
                        {isIncome ? '↓' : '↑'}
                      </span>
                      <span className="dashboard__movement-detail">
                        <strong>
                          {transaction.recipient ?? transaction.description}
                        </strong>
                        <span>
                          {typeLabel} · {formatTransactionDate(transaction.occurredAt)}
                        </span>
                      </span>
                      <span
                        className={`dashboard__movement-amount${isIncome ? ' dashboard__movement-amount--income' : ''}`}
                      >
                        {isIncome ? '+' : '−'}
                        {formatMoney(transaction.amount, transaction.currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <Modal
        isOpen={transferOpen}
        onClose={closeTransfer}
        title="Nueva transferencia"
        footer={
          <>
            <Button variant="solid" onClick={closeTransfer}>Cancelar</Button>
            <Button
              variant="solid"
              type="submit"
              form="dashboard-transfer-form"
            >
              Confirmar transferencia
            </Button>
          </>
        }
      >
        <form
          id="dashboard-transfer-form"
          className="dashboard__transfer-form"
          onSubmit={submitTransfer}
          noValidate
        >
          <label className="dashboard__field-label" htmlFor="transfer-currency">
            Moneda
          </label>
          <select
            id="transfer-currency"
            className="dashboard__select"
            name="currency"
            defaultValue="ARS"
            required
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency} · {CURRENCY_NAMES[currency]}
              </option>
            ))}
          </select>
          <Input
            label="Monto"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0,00"
            required
          />
          <Input
            label="Destinatario"
            name="recipient"
            type="text"
            autoComplete="name"
            placeholder="Nombre del destinatario"
            required
          />
          {formError && <p className="form-error" role="alert">{formError}</p>}
        </form>
      </Modal>
    </main>
  );
}
