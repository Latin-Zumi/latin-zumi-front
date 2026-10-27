import { useState } from "react";
import { Link } from "react-router-dom";
import RateChart from "../components/charts/RateChart";
import RateCard from "../components/wallet/RateCard";
import { useAuth } from "../context/auth";
import {
  QUOTED_CURRENCIES,
  formatChange,
  formatRate,
  getChange,
  getRateHistory,
  type QuotedCurrency,
} from "../services/ratesService";
import { CURRENCY_NAMES } from "../utils/money";

const PERIODS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [days, setDays] = useState(30);
  const [selected, setSelected] = useState<QuotedCurrency>("ARS");

  const histories = QUOTED_CURRENCIES.map((currency) => ({
    currency,
    points: getRateHistory(currency, days),
  }));
  const selectedPoints = getRateHistory(selected, days);
  const selectedChange = getChange(selectedPoints);
  const selectedTrend = selectedChange >= 0 ? "up" : "down";

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero__text">
          <p className="home-hero__eyebrow">Billetera digital multi-moneda</p>
          <h1>{user ? `¡Hola, ${user.nombre}!` : "Tu dinero, en todas tus monedas"}</h1>
          <p className="home-hero__lead">
            Guardá, transferí y cambiá pesos, dólares y euros desde un solo lugar.
          </p>
        </div>

        <div className="home-hero__actions">
          {isAuthenticated ? (
            <>
              <Link className="hero-action" to="/dashboard">
                <span className="hero-action__icon" aria-hidden="true">＋</span>
                Depositar
              </Link>
              <Link className="hero-action" to="/dashboard">
                <span className="hero-action__icon" aria-hidden="true">↗</span>
                Transferir
              </Link>
              <Link className="hero-action" to="/dashboard">
                <span className="hero-action__icon" aria-hidden="true">⇄</span>
                Cambiar moneda
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-lg btn-light">Crear cuenta gratis</Link>
              <Link to="/login" className="btn btn-lg btn-ghost">Ingresar</Link>
            </>
          )}
        </div>
      </section>

      <section className="market" aria-labelledby="market-title">
        <div className="market__header">
          <div>
            <h2 id="market-title">Cotizaciones</h2>
            <p className="market__subtitle">Valor de cada moneda por 1 USD</p>
          </div>
          <div className="segmented" role="group" aria-label="Período">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                className={`segmented__option${days === p.days ? " is-active" : ""}`}
                aria-pressed={days === p.days}
                onClick={() => setDays(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rate-grid">
          {histories.map(({ currency, points }) => (
            <RateCard
              key={currency}
              currency={currency}
              points={points}
              selected={currency === selected}
              onSelect={() => setSelected(currency)}
            />
          ))}
        </div>

        <article className="panel chart-panel">
          <header className="chart-panel__header">
            <div>
              <p className="chart-panel__title">
                {CURRENCY_NAMES[selected]} <span>({selected}/USD)</span>
              </p>
              <p className="chart-panel__value">
                {formatRate(selectedPoints[selectedPoints.length - 1].value)}
              </p>
            </div>
            <span className={`trend-pill trend-pill--${selectedTrend}`}>
              <span aria-hidden="true">{selectedTrend === "up" ? "▲" : "▼"}</span>
              {formatChange(selectedChange)} en {days} días
            </span>
          </header>

          <RateChart points={selectedPoints} label={`Evolución de ${selected} por USD en ${days} días`} />

          <details className="chart-panel__table">
            <summary>Ver como tabla</summary>
            <table>
              <caption className="sr-only">Cotizaciones por 1 USD en {days} días</caption>
              <thead>
                <tr>
                  <th scope="col">Moneda</th>
                  <th scope="col">Inicio</th>
                  <th scope="col">Actual</th>
                  <th scope="col">Variación</th>
                </tr>
              </thead>
              <tbody>
                {histories.map(({ currency, points }) => (
                  <tr key={currency}>
                    <th scope="row">{currency}</th>
                    <td>{formatRate(points[0].value)}</td>
                    <td>{formatRate(points[points.length - 1].value)}</td>
                    <td>{formatChange(getChange(points))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </article>

        <p className="market__note">Cotizaciones simuladas con fines de demostración.</p>
      </section>
    </main>
  );
}
