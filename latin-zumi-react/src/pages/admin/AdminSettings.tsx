import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminError from '../../components/admin/AdminError';
import { LoadingState } from '../../components/states';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getSettings, getSettingsHistory, updateSettings } from '../../services/adminService';
import type { Currency } from '../../types';
import type { AdminSettings, SettingsChange } from '../../types/admin';
import {
  formatPercent,
  getSettingLabel,
  MAX_INTEREST_PERCENT,
  MAX_SPREAD_PERCENT,
  parsePercentInput,
  toPercentInput,
} from '../../utils/admin';
import { CURRENCY_NAMES } from '../../utils/money';
import { formatTransactionDate } from '../../utils/transactions';

interface FormValues {
  spread: string;
  rates: Partial<Record<Currency, string>>;
}

type FormErrors = Partial<Record<'spread' | Currency, string>>;

function toFormValues(settings: AdminSettings): FormValues {
  return {
    spread: toPercentInput(settings.exchange_spread_percent),
    rates: Object.fromEntries(
      settings.interest_rates.map((rate) => [rate.currency, toPercentInput(rate.annual_percent)]),
    ),
  };
}

const percentError = (max: number) => `Ingresá un porcentaje de 0 a ${max}, con hasta dos decimales.`;

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [history, setHistory] = useState<SettingsChange[]>([]);
  const [values, setValues] = useState<FormValues>({ spread: '', rates: {} });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([getSettings(), getSettingsHistory()])
      .then(([current, changes]) => {
        if (ignore) return;
        setSettings(current);
        setValues(toFormValues(current));
        setHistory(changes.items);
        setLoadError('');
      })
      .catch((error: unknown) => {
        if (!ignore) setLoadError(error instanceof Error ? error.message : 'No pudimos cargar los parámetros.');
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || isSaving || savingRef.current) return;
    setNotice('');
    setSaveError('');

    const nextErrors: FormErrors = {};
    const spread = parsePercentInput(values.spread, MAX_SPREAD_PERCENT);
    if (spread === null) nextErrors.spread = percentError(MAX_SPREAD_PERCENT);
    const rates = settings.interest_rates.map(({ currency }) => {
      const annual = parsePercentInput(values.rates[currency] ?? '', MAX_INTEREST_PERCENT);
      if (annual === null) nextErrors[currency] = percentError(MAX_INTEREST_PERCENT);
      return { currency, annual_percent: annual ?? '' };
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || spread === null) return;

    const changes: Parameters<typeof updateSettings>[0] = {};
    const originalSpread = parsePercentInput(
      settings.exchange_spread_percent,
      MAX_SPREAD_PERCENT,
    );
    if (spread !== originalSpread) {
      changes.exchange_spread_percent = spread;
    }
    const changedRates = rates.flatMap((rate) => {
      const originalRate = settings.interest_rates.find(
        (item) => item.currency === rate.currency,
      );
      const originalAnnual = originalRate
        ? parsePercentInput(originalRate.annual_percent, MAX_INTEREST_PERCENT)
        : null;
      return rate.annual_percent !== originalAnnual
        ? [{ currency: rate.currency, annual_percent: rate.annual_percent ?? '' }]
        : [];
    });
    if (changedRates.length > 0) changes.interest_rates = changedRates;

    if (Object.keys(changes).length === 0) {
      setNotice('No hay cambios para guardar');
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    try {
      const updated = await updateSettings(changes);
      setSettings(updated);
      setValues(toFormValues(updated));
      setNotice('Guardamos los parámetros.');
      try {
        setHistory((await getSettingsHistory()).items);
      } catch {
        setNotice('Guardamos los parámetros, pero no pudimos actualizar el historial.');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No pudimos guardar los parámetros.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <section className="admin-page" aria-labelledby="admin-settings-title">
      <header className="admin-page__header">
        <div>
          <p className="dashboard__eyebrow">Panel de administración</p>
          <h1 id="admin-settings-title">Parámetros</h1>
          <p className="admin-page__intro">
            Comisión de los cambios de moneda e interés anual sobre los saldos.
          </p>
        </div>
      </header>

      {loadError ? (
        <AdminError message={loadError} onRetry={() => setAttempt((value) => value + 1)} />
      ) : !settings ? (
        <LoadingState message="Cargando los parámetros..." />
      ) : (
        <>
          <form className="admin-card admin-settings" onSubmit={(event) => void save(event)} noValidate>
            <fieldset className="admin-settings__group">
              <legend>Cambios de moneda</legend>
              <Input
                label="Comisión (%)"
                inputMode="decimal"
                value={values.spread}
                error={errors.spread}
                disabled={isSaving}
                onChange={(event) => setValues({ ...values, spread: event.target.value })}
              />
              <p className="admin-card__note">
                Se descuenta de la cotización de mercado. Máximo {MAX_SPREAD_PERCENT} %.
              </p>
            </fieldset>

            <fieldset className="admin-settings__group">
              <legend>Interés anual sobre el saldo</legend>
              <div className="admin-settings__rates">
                {settings.interest_rates.map(({ currency }) => (
                  <Input
                    key={currency}
                    label={`${CURRENCY_NAMES[currency]} (%)`}
                    inputMode="decimal"
                    value={values.rates[currency] ?? ''}
                    error={errors[currency]}
                    disabled={isSaving}
                    onChange={(event) =>
                      setValues({ ...values, rates: { ...values.rates, [currency]: event.target.value } })
                    }
                  />
                ))}
              </div>
              <p className="admin-card__note">
                Se acredita una vez por día, con la tasa vigente al momento de acreditar.
              </p>
            </fieldset>

            {saveError && <p className="form-error" role="alert">{saveError}</p>}
            {notice && <p className="form-notice" role="status">{notice}</p>}
            {isSaving && <p className="form-notice" role="status">Guardando parámetros…</p>}

            <div className="admin-settings__footer">
              {settings.updated_at && settings.updated_by && (
                <p className="admin-card__note">
                  Último cambio: {formatTransactionDate(settings.updated_at)} por {settings.updated_by.nombre}
                </p>
              )}
              <Button variant="solid" type="submit" loading={isSaving}>
                Guardar cambios
              </Button>
            </div>
          </form>

          <div className="admin-card">
            <h2>Historial de cambios</h2>
            {history.length === 0 ? (
              <p className="admin-card__note">Todavía nadie cambió los parámetros.</p>
            ) : (
              <ul className="admin-history">
                {history.map((change) => (
                  <li key={change.id} className="admin-history__item">
                    <span className="admin-history__field">{getSettingLabel(change.field)}</span>
                    <span>
                      {formatPercent(change.old_value)} → <strong>{formatPercent(change.new_value)}</strong>
                    </span>
                    <span className="admin-history__meta">
                      {formatTransactionDate(change.changed_at)} · {change.changed_by?.nombre ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
