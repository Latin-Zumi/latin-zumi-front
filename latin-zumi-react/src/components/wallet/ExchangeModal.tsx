import { useEffect, useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useWallet } from '../../context/wallet';
import { TransactionError, getExchangeQuote } from '../../services/transactionService';
import type { Currency, ExchangeQuote } from '../../types';
import {
  CURRENCY_NAMES,
  formatExchangeRate,
  formatMoney,
  fromCents,
  getAvailableAmount,
  getInsufficientFundsError,
  INVALID_AMOUNT_MESSAGE,
  parseAmountInput,
  toCents,
} from '../../utils/money';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import AvailableBalance from './AvailableBalance';

const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];

const exchangeSchema = z
  .object({
    from: z.enum(CURRENCIES),
    to: z.enum(CURRENCIES),
    amount: z
      .string()
      .trim()
      .min(1, 'Ingresá un monto.')
      .refine((value) => parseAmountInput(value) !== null, INVALID_AMOUNT_MESSAGE),
  })
  .refine((data) => data.from !== data.to, 'Elegí dos monedas distintas.');

interface ExchangeRequest {
  from: Currency;
  to: Currency;
  amount: string;
}

// Cotización que espera confirmación. La clave se reutiliza si hay que reintentar la misma cotización.
interface PendingExchange extends ExchangeRequest {
  quote: ExchangeQuote;
  idempotencyKey: string;
}

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCurrency: Currency;
}

export default function ExchangeModal({ isOpen, onClose, defaultCurrency }: ExchangeModalProps) {
  const wallet = useWallet();
  const [pending, setPending] = useState<PendingExchange | null>(null);
  // Moneda de origen y monto controlados para mostrar el disponible y avisar mientras se escribe
  const [fromCurrency, setFromCurrency] = useState<Currency | null>(null);
  const [amount, setAmount] = useState('');
  const [expiredByServer, setExpiredByServer] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // El estado tarda un render en deshabilitar el botón; el ref frena el doble clic al instante
  const submittingRef = useRef(false);

  // Cuenta regresiva mientras hay una cotización en pantalla
  useEffect(() => {
    if (!pending) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [pending]);

  const secondsLeft = pending
    ? Math.max(0, Math.ceil((new Date(pending.quote.expires_at).getTime() - now) / 1000))
    : 0;
  const isExpired = expiredByServer || (pending !== null && secondsLeft === 0);
  const selectedFrom = fromCurrency ?? defaultCurrency;
  const amountError = getInsufficientFundsError(
    amount,
    getAvailableAmount(wallet.balances, selectedFrom),
  );

  function close() {
    if (submittingRef.current) return;
    setPending(null);
    setFormError('');
    setFromCurrency(null);
    setAmount('');
    onClose();
  }

  function showError(error: unknown) {
    setFormError(
      error instanceof TransactionError
        ? error.message
        : 'Ocurrió un error inesperado. Probá de nuevo.',
    );
  }

  async function requestQuote(request: ExchangeRequest) {
    if (submittingRef.current) return;
    setFormError('');
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const quote = await getExchangeQuote(request.from, request.to, request.amount);
      setNow(Date.now());
      setExpiredByServer(false);
      setPending({ ...request, quote, idempotencyKey: crypto.randomUUID() });
    } catch (error) {
      showError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function reviewExchange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    const formData = new FormData(event.currentTarget);
    const result = exchangeSchema.safeParse({
      from: formData.get('from'),
      to: formData.get('to'),
      amount: formData.get('amount'),
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revisá los datos ingresados.');
      return;
    }

    const cents = parseAmountInput(result.data.amount) ?? 0;
    const balance = wallet.balances.find((item) => item.currency === result.data.from);
    if (!balance || cents > toCents(balance.amount)) {
      setFormError('No tenés saldo suficiente en esa moneda.');
      return;
    }

    void requestQuote({ from: result.data.from, to: result.data.to, amount: fromCents(cents) });
  }

  async function confirmExchange() {
    if (!pending || isExpired || submittingRef.current) return;
    setFormError('');
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await wallet.exchange(pending.quote.quote_id, pending.idempotencyKey);
      submittingRef.current = false;
      close();
    } catch (error) {
      if (error instanceof TransactionError && error.code === 'QUOTE_EXPIRED') {
        setExpiredByServer(true);
      }
      showError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={pending ? 'Confirmá el cambio' : 'Cambiar moneda'}
      footer={
        pending ? (
          <>
            <Button variant="solid" outline onClick={() => setPending(null)} disabled={isSubmitting}>
              Volver
            </Button>
            {isExpired ? (
              <Button variant="solid" onClick={() => void requestQuote(pending)} loading={isSubmitting}>
                Actualizar cotización
              </Button>
            ) : (
              <Button variant="solid" onClick={() => void confirmExchange()} loading={isSubmitting}>
                Confirmar cambio
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="solid" outline onClick={close}>
              Cancelar
            </Button>
            <Button variant="solid" type="submit" form="dashboard-exchange-form" loading={isSubmitting}>
              Cotizar
            </Button>
          </>
        )
      }
    >
      {pending && (
        <div className="dashboard__transfer-form">
          <p>
            Entregás <strong>{formatMoney(pending.amount, pending.from)}</strong> y recibís{' '}
            <strong>{formatMoney(pending.quote.to_amount, pending.to)}</strong>.
          </p>
          <p className="dashboard__muted">
            Tipo de cambio: {formatExchangeRate(pending.from, pending.to, Number(pending.quote.rate))}
          </p>
          {/* Se anuncia solo el vencimiento, no cada segundo de la cuenta regresiva */}
          {isExpired ? (
            <p className="form-notice" role="status">
              La cotización venció. Actualizala para ver el valor de ahora.
            </p>
          ) : (
            <p className="form-notice">Cotización válida por {secondsLeft} s</p>
          )}
          {formError && !expiredByServer && <p className="form-error" role="alert">{formError}</p>}
        </div>
      )}
      {/* El formulario queda montado (oculto) para no perder lo cargado al tocar "Volver" */}
      <form
        id="dashboard-exchange-form"
        className="dashboard__transfer-form"
        hidden={pending !== null}
        onSubmit={reviewExchange}
        noValidate
      >
        <label className="dashboard__field-label" htmlFor="exchange-from">
          Moneda que entregás
        </label>
        <select
          id="exchange-from"
          className="dashboard__select"
          name="from"
          value={selectedFrom}
          onChange={(event) => {
            const currency = CURRENCIES.find((item) => item === event.target.value);
            if (currency) setFromCurrency(currency);
          }}
          required
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency} · {CURRENCY_NAMES[currency]}
            </option>
          ))}
        </select>
        <AvailableBalance
          id="exchange-available"
          currency={selectedFrom}
          balances={wallet.balances}
          onUseAll={setAmount}
        />
        <label className="dashboard__field-label" htmlFor="exchange-to">
          Moneda que recibís
        </label>
        <select
          id="exchange-to"
          className="dashboard__select"
          name="to"
          defaultValue={defaultCurrency === 'USD' ? 'ARS' : 'USD'}
          required
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency} · {CURRENCY_NAMES[currency]}
            </option>
          ))}
        </select>
        <Input
          label="Monto a cambiar"
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={amountError}
          aria-describedby="exchange-available"
          required
        />
        {!pending && formError && <p className="form-error" role="alert">{formError}</p>}
      </form>
    </Modal>
  );
}
