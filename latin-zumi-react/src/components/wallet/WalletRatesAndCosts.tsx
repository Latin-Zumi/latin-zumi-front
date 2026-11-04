import type { Balance } from '../../types';
import { formatExchangeRate, CURRENCY_NAMES } from '../../utils/money';
import type { CurrencyRates } from '../../utils/dashboard';

type WalletRatesAndCostsProps = {
  balances: Balance[];
  rates: CurrencyRates;
};

export function WalletRatesAndCosts({ balances, rates }: WalletRatesAndCostsProps) {
  const currencies = [...new Set(balances.map(({ currency }) => currency))];
  const pairs = currencies.flatMap((from, index) =>
    currencies.slice(index + 1).map((to) => ({
      from,
      to,
      rate: rates[to] / rates[from],
    })),
  );

  return (
    <section className="wallet-rates" aria-labelledby="wallet-rates-title">
      <header className="wallet-rates__heading">
        <h2 id="wallet-rates-title">Tasas y costos</h2>
        <p>Tasas referenciales simuladas; la cotización final se confirma al cambiar moneda.</p>
      </header>

      <div className="wallet-rates__content">
        <div>
          <h3 className="wallet-rates__subheading">Tasas de cambio</h3>
          {pairs.length > 0 ? (
            <dl className="wallet-rates__list">
              {pairs.map(({ from, to, rate }) => (
                <div className="wallet-rates__row" key={`${from}-${to}`}>
                  <dt>{CURRENCY_NAMES[from]} / {CURRENCY_NAMES[to]}</dt>
                  <dd>{formatExchangeRate(from, to, rate)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="wallet-rates__empty">
              Se necesitan saldos en al menos dos monedas para mostrar una tasa.
            </p>
          )}
        </div>

        <dl className="wallet-rates__costs">
          <div className="wallet-rates__cost">
            <dt>Comisión</dt>
            <dd>0 %</dd>
          </div>
          <div className="wallet-rates__cost">
            <dt>Interés</dt>
            <dd>0 %</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export default WalletRatesAndCosts;
