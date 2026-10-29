import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import ActivityChart from '../components/ActivityChart';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import BalanceCard from '../components/wallet/BalanceCard';
import BalanceTable from '../components/wallet/BalanceTable';
import DepositModal from '../components/wallet/DepositModal';
import ExchangeModal from '../components/wallet/ExchangeModal';
import { TRANSACTIONS_ENABLED } from '../config/features';
import { useAuth } from '../context/auth';
import { useWallet } from '../context/wallet';
import {
  TransactionError,
  lookupUser,
  type TransferData,
} from '../services/transactionService';
import {
  calculateActivityByDay,
  calculateSpentToday,
  calculateTotalBalance,
  getCurrentRates,
  getRecentTransactions,
  isIncome,
} from '../utils/dashboard';
import {
  CURRENCY_NAMES,
  formatMoney,
  fromCents,
  parseAmountInput,
  toCents,
} from '../utils/money';
import type { Currency } from '../types';
import {
  formatTransactionDate,
  getTransactionDescription,
  TRANSACTION_TYPE_LABELS,
} from '../utils/transactions';

const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];

const transferSchema = z.object({
  currency: z.enum(CURRENCIES),
  amount: z
    .string()
    .trim()
    .min(1, 'Ingresá un monto.')
    .refine((value) => parseAmountInput(value) !== null, 'Ingresá un monto mayor a cero, con hasta dos decimales.'),
  recipient_email: z
    .string()
    .trim()
    .min(1, 'Ingresá el email del destinatario.')
    .email('Ingresá un email válido.'),
});

// Datos validados que esperan confirmación. La clave se reutiliza si hay que reintentar.
interface PendingTransfer {
  data: TransferData;
  recipientName: string;
  idempotencyKey: string;
}

function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((currency) => currency === value);
}

export default function Dashboard() {
  const { user } = useAuth();
  const wallet = useWallet();
  const [transferOpen, setTransferOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [pending, setPending] = useState<PendingTransfer | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // El estado tarda un render en deshabilitar el botón; el ref frena el doble clic al instante
  const submittingRef = useRef(false);

  if (!user) {
    return <ErrorState message="No pudimos cargar los datos de tu usuario." />;
  }

  if (!isCurrency(user.moneda_preferida)) {
    return <ErrorState message="Tu moneda preferida no es válida." />;
  }

  if (wallet.isLoading) {
    return (
      <main className="dashboard">
        <LoadingState message="Cargando tu billetera..." />
      </main>
    );
  }

  if (wallet.error) {
    return (
      <main className="dashboard">
        <ErrorState message={wallet.error} onRetry={() => void wallet.reload()} />
      </main>
    );
  }

  const { balances, transactions } = wallet;
  const preferredCurrency = user.moneda_preferida;
  const rates = getCurrentRates();
  const totalBalance = calculateTotalBalance(balances, preferredCurrency, rates);
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
    if (isSubmitting) return;
    setTransferOpen(false);
    setPending(null);
    setFormError('');
  }

  async function reviewTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setFormError('');

    const formData = new FormData(event.currentTarget);
    const result = transferSchema.safeParse({
      currency: formData.get('currency'),
      amount: formData.get('amount'),
      recipient_email: formData.get('recipient_email'),
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revisá los datos ingresados.');
      return;
    }

    const cents = parseAmountInput(result.data.amount) ?? 0;
    const balance = balances.find((item) => item.currency === result.data.currency);
    if (!balance || cents > toCents(balance.amount)) {
      setFormError('No tenés saldo suficiente en esa moneda.');
      return;
    }

    const recipientEmail = result.data.recipient_email.toLowerCase();
    if (recipientEmail === user?.email.toLowerCase()) {
      setFormError('No podés transferirte a vos mismo.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const recipient = await lookupUser(recipientEmail);
      setPending({
        data: {
          recipient_email: recipientEmail,
          currency: result.data.currency,
          amount: fromCents(cents),
        },
        recipientName: recipient.nombre,
        idempotencyKey: crypto.randomUUID(),
      });
    } catch (error) {
      setFormError(
        error instanceof TransactionError
          ? error.message
          : 'Ocurrió un error inesperado. Probá de nuevo.',
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function confirmTransfer() {
    if (!pending || submittingRef.current) return;
    setFormError('');
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await wallet.transfer(pending.data, pending.idempotencyKey);
      setTransferOpen(false);
      setPending(null);
    } catch (error) {
      setFormError(
        error instanceof TransactionError
          ? error.message
          : 'Ocurrió un error inesperado. Probá de nuevo.',
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="dashboard">
      <section className="home-hero dashboard-hero" aria-labelledby="dashboard-title">
        <div className="home-hero__text">
          <p className="home-hero__eyebrow">Resumen de tu billetera</p>
          <h1 id="dashboard-title">¡Hola, {user.nombre}!</h1>
          <p className="home-hero__lead">
            Saldo total estimado en {CURRENCY_NAMES[preferredCurrency]}
          </p>
          <p className="dashboard-hero__balance">
            {formatMoney(totalBalance, preferredCurrency)}
          </p>
        </div>
        {/* Las operaciones solo existen en el mock hasta que el backend tenga sus endpoints */}
        {TRANSACTIONS_ENABLED && (
          <div className="home-hero__actions">
            <Button variant="solid" size="lg" onClick={() => setDepositOpen(true)}>
              Depositar
            </Button>
            <Button variant="solid" size="lg" onClick={() => setExchangeOpen(true)}>
              Cambiar
            </Button>
            <Button variant="solid" size="lg" onClick={() => setTransferOpen(true)}>
              Transferir
            </Button>
          </div>
        )}
      </section>

      <section className="dashboard__balances" aria-labelledby="balances-title">
        <div className="dashboard__section-heading">
          <div>
            <p className="dashboard__eyebrow">Tus monedas</p>
            <h2 id="balances-title">Saldos disponibles</h2>
          </div>
        </div>
        {balances.length === 0 ? (
          <EmptyState title="Sin balances" variant="no-balance" />
        ) : (
          <>
            <div className="dashboard__balance-grid">
              {balances.map((balance) => (
                <BalanceCard key={balance.account_id} balance={balance} />
              ))}
            </div>
            <details className="dashboard__balances-table">
              <summary>Ver saldos como tabla</summary>
              <BalanceTable balances={balances} />
            </details>
          </>
        )}
      </section>

      <section className="dashboard__history-card" aria-labelledby="history-card-title">
        <div className="dashboard__history-copy">
          <span className="dashboard__history-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3.5 12a8.5 8.5 0 1 0 2.49-6.01L3.5 8.5" />
              <path d="M3.5 4.5v4h4M12 7.5V12l3 2" />
            </svg>
          </span>
          <div className="dashboard__history-text">
            <h2 id="history-card-title">Historial de movimientos</h2>
            <p>Consultá tus ingresos, envíos y operaciones en un solo lugar.</p>
          </div>
        </div>
        <Link className="btn btn-lg dashboard__history-link" to="/historial">
          Ver historial completo
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>
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
              <span>Enviado hoy</span>
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
            {!TRANSACTIONS_ENABLED ? (
              <p className="dashboard__muted">
                El historial estará disponible cuando el backend habilite los movimientos.
              </p>
            ) : recentTransactions.length === 0 ? (
              <EmptyState
                title="Todavía no hay movimientos"
                description="Tus depósitos y transferencias aparecerán acá."
                variant="no-transactions"
              />
            ) : (
              <ul className="dashboard__movement-list">
                {recentTransactions.map((transaction) => {
                  const income = isIncome(transaction);
                  const exchange = transaction.exchange;
                  // El cambio de moneda no es ingreso ni gasto: va con estilo neutro
                  const tone = exchange ? '--neutral' : income ? '--income' : '';
                  return (
                    <li className="dashboard__movement" key={transaction.id}>
                      <span
                        className={`dashboard__movement-icon${tone && ` dashboard__movement-icon${tone}`}`}
                        aria-hidden="true"
                      >
                        {exchange ? '⇄' : income ? '↓' : '↑'}
                      </span>
                      <span className="dashboard__movement-detail">
                        <strong>
                          {getTransactionDescription(transaction)}
                        </strong>
                        <span>
                          {TRANSACTION_TYPE_LABELS[transaction.type]} · {formatTransactionDate(transaction.created_at)}
                        </span>
                      </span>
                      <span
                        className={`dashboard__movement-amount${tone && ` dashboard__movement-amount${tone}`}`}
                      >
                        {income ? '+' : '−'}
                        {formatMoney(transaction.amount, transaction.currency)}
                        {exchange && ` → +${formatMoney(exchange.to_amount, exchange.to_currency)}`}
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
        title={pending ? 'Confirmá la transferencia' : 'Nueva transferencia'}
        footer={
          pending ? (
            <>
              <Button variant="solid" onClick={() => setPending(null)} disabled={isSubmitting}>
                Volver
              </Button>
              <Button variant="solid" onClick={() => void confirmTransfer()} loading={isSubmitting}>
                Confirmar transferencia
              </Button>
            </>
          ) : (
            <>
              <Button variant="solid" onClick={closeTransfer} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                variant="solid"
                type="submit"
                form="dashboard-transfer-form"
                loading={isSubmitting}
              >
                Continuar
              </Button>
            </>
          )
        }
      >
        {/* El formulario queda montado (oculto) para no perder lo cargado al tocar "Volver" */}
        {pending && (
          <div className="dashboard__transfer-form">
            <p>
              Vas a transferir{' '}
              <strong>{formatMoney(pending.data.amount, pending.data.currency)}</strong>{' '}
              a <strong>{pending.recipientName}</strong> ({pending.data.recipient_email}).
            </p>
            {formError && <p className="form-error" role="alert">{formError}</p>}
          </div>
        )}
        <form
            id="dashboard-transfer-form"
            className="dashboard__transfer-form"
            hidden={pending !== null}
            onSubmit={(event) => void reviewTransfer(event)}
            noValidate
          >
            <label className="dashboard__field-label" htmlFor="transfer-currency">
              Moneda
            </label>
            <select
              id="transfer-currency"
              className="dashboard__select"
              name="currency"
              defaultValue={preferredCurrency}
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
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              required
            />
            <Input
              label="Email del destinatario"
              name="recipient_email"
              type="email"
              autoComplete="email"
              placeholder="nombre@ejemplo.com"
              required
            />
            {!pending && formError && <p className="form-error" role="alert">{formError}</p>}
          </form>
      </Modal>
      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        defaultCurrency={preferredCurrency}
      />
      <ExchangeModal
        isOpen={exchangeOpen}
        onClose={() => setExchangeOpen(false)}
        defaultCurrency={preferredCurrency}
      />
    </main>
  );
}
