import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useWallet } from '../../hooks/useWallet';
import { TransactionError, type DepositData } from '../../services/transactionService';
import type { Currency } from '../../types';
import {
  CURRENCY_NAMES,
  formatMoney,
  fromCents,
  parseAmountInput,
} from '../../utils/money';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];

const depositSchema = z.object({
  currency: z.enum(CURRENCIES),
  amount: z
    .string()
    .trim()
    .min(1, 'Ingresá un monto.')
    .refine((value) => parseAmountInput(value) !== null, 'Ingresá un monto mayor a cero, con hasta dos decimales.'),
});

// Datos validados que esperan confirmación. La clave se reutiliza si hay que reintentar.
interface PendingDeposit {
  data: DepositData;
  idempotencyKey: string;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCurrency: Currency;
}

export default function DepositModal({ isOpen, onClose, defaultCurrency }: DepositModalProps) {
  const wallet = useWallet();
  const [pending, setPending] = useState<PendingDeposit | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // El estado tarda un render en deshabilitar el botón; el ref frena el doble clic al instante
  const submittingRef = useRef(false);

  function close() {
    if (submittingRef.current) return;
    setPending(null);
    setFormError('');
    onClose();
  }

  function reviewDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    const formData = new FormData(event.currentTarget);
    const result = depositSchema.safeParse({
      currency: formData.get('currency'),
      amount: formData.get('amount'),
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revisá los datos ingresados.');
      return;
    }

    setPending({
      data: {
        currency: result.data.currency,
        amount: fromCents(parseAmountInput(result.data.amount) ?? 0),
      },
      idempotencyKey: crypto.randomUUID(),
    });
  }

  async function confirmDeposit() {
    if (!pending || submittingRef.current) return;
    setFormError('');
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await wallet.deposit(pending.data, pending.idempotencyKey);
      submittingRef.current = false;
      close();
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
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={pending ? 'Confirmá el depósito' : 'Nuevo depósito'}
      footer={
        pending ? (
          <>
            <Button variant="solid" onClick={() => setPending(null)} disabled={isSubmitting}>
              Volver
            </Button>
            <Button variant="solid" onClick={() => void confirmDeposit()} loading={isSubmitting}>
              Confirmar depósito
            </Button>
          </>
        ) : (
          <>
            <Button variant="solid" onClick={close}>
              Cancelar
            </Button>
            <Button variant="solid" type="submit" form="dashboard-deposit-form">
              Continuar
            </Button>
          </>
        )
      }
    >
      {pending && (
        <div className="dashboard__transfer-form">
          <p>
            Vas a depositar{' '}
            <strong>{formatMoney(pending.data.amount, pending.data.currency)}</strong>{' '}
            en tu saldo en {CURRENCY_NAMES[pending.data.currency]}.
          </p>
          {formError && <p className="form-error" role="alert">{formError}</p>}
        </div>
      )}
      {/* El formulario queda montado (oculto) para no perder lo cargado al tocar "Volver" */}
      <form
        id="dashboard-deposit-form"
        className="dashboard__transfer-form"
        hidden={pending !== null}
        onSubmit={reviewDeposit}
        noValidate
      >
        {USE_MOCK && (
          <p className="form-notice">
            Depósito de prueba: el saldo se acredita al instante.
          </p>
        )}
        <label className="dashboard__field-label" htmlFor="deposit-currency">
          Moneda
        </label>
        <select
          id="deposit-currency"
          className="dashboard__select"
          name="currency"
          defaultValue={defaultCurrency}
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
        {!pending && formError && <p className="form-error" role="alert">{formError}</p>}
      </form>
    </Modal>
  );
}
