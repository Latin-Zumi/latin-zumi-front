import type { Currency, WalletRates } from '../../types';
import { CURRENCY_NAMES, formatExchangeRate, formatPercent } from '../../utils/money';
import Button from '../ui/Button';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'ARS', 'COP'];

const DATE_FORMAT = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' });

type WalletRatesAndCostsProps = {
  data: WalletRates | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
};

function getCosts({ exchange_spread_percent, interest_rates }: WalletRates) {
  const costs = [{ label: 'Comisión', value: exchange_spread_percent }];
  const sameInterest = new Set(interest_rates.map(({ annual_percent }) => Number(annual_percent))).size === 1;

  if (sameInterest) {
    return [...costs, { label: 'Interés anual', value: interest_rates[0].annual_percent }];
  }
  return [
    ...costs,
    ...interest_rates.map(({ currency, annual_percent }) => ({
      label: `Interés anual en ${CURRENCY_NAMES[currency].toLowerCase()}`,
      value: annual_percent,
    })),
  ];
}

export function WalletRatesAndCosts({ data, isLoading, hasError, onRetry }: WalletRatesAndCostsProps) {
  return (
    <section className="wallet-rates" aria-labelledby="wallet-rates-title">
      <header className="wallet-rates__heading">
        <h2 id="wallet-rates-title">Tasas y costos</h2>
        <p>
          Tasas de mercado, antes de la comisión. La cotización final se confirma al cambiar moneda.
          {data && ` Actualizadas: ${DATE_FORMAT.format(new Date(data.observed_at))}`}
        </p>
      </header>

      {isLoading && <p className="wallet-rates__status" role="status">Cargando las tasas...</p>}

      {hasError && (
        <div className="wallet-rates__error">
          <p className="wallet-rates__status" role="alert">
            No pudimos cargar las tasas y los costos.
          </p>
          <Button variant="solid" outline onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}

      {data && (
        <div className="wallet-rates__content">
          <div>
            <h3 className="wallet-rates__subheading">Tasas de cambio</h3>
            <dl className="wallet-rates__list">
              {CURRENCIES.flatMap((from, index) =>
                CURRENCIES.slice(index + 1).map((to) => (
                  <div className="wallet-rates__row" key={`${from}-${to}`}>
                    <dt>{CURRENCY_NAMES[from]} / {CURRENCY_NAMES[to]}</dt>
                    <dd>{formatExchangeRate(from, to, data.rates[to] / data.rates[from])}</dd>
                  </div>
                )),
              )}
            </dl>
          </div>

          <dl className="wallet-rates__costs">
            {getCosts(data).map(({ label, value }) => (
              <div className="wallet-rates__cost" key={label}>
                <dt>{label}</dt>
                <dd>{formatPercent(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

export default WalletRatesAndCosts;
