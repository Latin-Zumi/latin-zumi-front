import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import ActivityChart from '../components/ActivityChart';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
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
  formatTransactionTime,
  getTransactionDescription,
  groupTransactionsByDay,
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
  // El saldo grande es el de la moneda del usuario; el resto se nombra en una frase
  const mainBalance =
    balances.find((balance) => balance.currency === preferredCurrency) ?? balances[0];
  const otherBalances = balances.filter((balance) => balance !== mainBalance);
  const activityByDay = calculateActivityByDay(
    transactions,
    preferredCurrency,
    rates,
    new Date(),
    7,
  );
  const weekIncome = activityByDay.reduce((total, day) => total + day.income, 0);
  const weekExpenses = activityByDay.reduce((total, day) => total + day.expenses, 0);
  const recentGroups = groupTransactionsByDay(
    getRecentTransactions(transactions, 5),
    new Date(),
  );

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
      <section className="dashboard-summary" aria-labelledby="dashboard-title">
        <div className="dashboard-summary__text">
          <h1 id="dashboard-title" className="dashboard-summary__greeting">
            Hola, {user.nombre}
          </h1>
          {mainBalance ? (
            <>
              <p className="dashboard-summary__amount">
                {formatMoney(mainBalance.amount, mainBalance.currency)}
              </p>
              <p className="dashboard-summary__label">
                Saldo disponible en {CURRENCY_NAMES[mainBalance.currency].toLowerCase()}
              </p>
              {otherBalances.length > 0 && (
                <p className="dashboard-summary__others">
                  También tenés{' '}
                  {otherBalances.map((balance, index) => (
                    <span key={balance.account_id}>
                      <strong>{formatMoney(balance.amount, balance.currency)}</strong>
                      {index < otherBalances.length - 2
                        ? ', '
                        : index === otherBalances.length - 2
                          ? ' y '
                          : '.'}
                    </span>
                  ))}
                </p>
              )}
            </>
          ) : (
            <EmptyState title="Sin balances" variant="no-balance" />
          )}
        </div>
        {/* Las operaciones solo existen en el mock hasta que el backend tenga sus endpoints */}
        {TRANSACTIONS_ENABLED && (
          <div className="dashboard-summary__actions">
            <Button variant="solid" size="lg" onClick={() => setDepositOpen(true)}>
              Depositar
            </Button>
            <Button variant="solid" size="lg" outline onClick={() => setTransferOpen(true)}>
              Transferir
            </Button>
            <Button variant="solid" size="lg" outline onClick={() => setExchangeOpen(true)}>
              Cambiar
            </Button>
          </div>
        )}
      </section>

      <div className="dashboard__content">
        <section className="dashboard__movements" aria-labelledby="movements-title">
          <header className="dashboard__section-heading">
            <h2 id="movements-title">Movimientos</h2>
            <Link className="dashboard__see-all" to="/historial">
              Ver todos
            </Link>
          </header>
          {!TRANSACTIONS_ENABLED ? (
            <p className="dashboard__muted">
              El historial estará disponible cuando el backend habilite los movimientos.
            </p>
          ) : recentGroups.length === 0 ? (
            <EmptyState
              title="Todavía no hay movimientos"
              description="Tus depósitos y transferencias aparecerán acá."
              variant="no-transactions"
            />
          ) : (
            recentGroups.map((group) => (
              <section className="dashboard__day" key={group.key} aria-label={group.label}>
                <h3 className="dashboard__day-label" aria-hidden="true">{group.label}</h3>
                <ul className="dashboard__movement-list">
                  {group.transactions.map((transaction) => {
                    const income = isIncome(transaction);
                    const exchange = transaction.exchange;
                    // El cambio de moneda no es ingreso ni gasto: va con estilo neutro
                    const tone = exchange ? '--neutral' : income ? '--income' : '';
                    return (
                      <li className="dashboard__movement" key={transaction.id}>
                        <span className="dashboard__movement-detail">
                          <strong>{getTransactionDescription(transaction)}</strong>
                          <span>
                            {formatTransactionTime(transaction.created_at)} · {TRANSACTION_TYPE_LABELS[transaction.type]}
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
              </section>
            ))
          )}
        </section>

        <aside className="feature-surface dashboard__week" aria-labelledby="week-title">
          <h2 id="week-title">Esta semana</h2>
          <ActivityChart data={activityByDay} currency={preferredCurrency} />
          <dl className="dashboard__week-totals">
            <div>
              <dt>Entró</dt>
              <dd>{formatMoney(weekIncome, preferredCurrency)}</dd>
            </div>
            <div>
              <dt>Salió</dt>
              <dd>{formatMoney(weekExpenses, preferredCurrency)}</dd>
            </div>
          </dl>
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
