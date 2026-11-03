import { useEffect, useState } from 'react';
import { LoadingState } from '../../components/states';
import AdminError from '../../components/admin/AdminError';
import { getMetrics } from '../../services/adminService';
import type { AdminMetrics, MetricsPeriod } from '../../types/admin';
import { CURRENCY_NAMES, formatMoney } from '../../utils/money';

const PERIOD_LABELS: Record<MetricsPeriod, string> = { day: 'Hoy', month: 'Este mes' };

export default function AdminOverview() {
  const [period, setPeriod] = useState<MetricsPeriod>('day');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false; // descarta la respuesta si se cambió el período mientras cargaba
    getMetrics(period)
      .then((data) => {
        if (ignore) return;
        setMetrics(data);
        setError('');
      })
      .catch((caught: unknown) => {
        if (!ignore) setError(caught instanceof Error ? caught.message : 'No pudimos cargar el resumen.');
      });
    return () => {
      ignore = true;
    };
  }, [period, attempt]);

  const current = metrics?.period === period ? metrics : null;

  return (
    <section className="admin-page" aria-labelledby="admin-overview-title">
      <header className="admin-page__header">
        <div>
          <p className="dashboard__eyebrow">Panel de administración</p>
          <h1 id="admin-overview-title">Resumen</h1>
        </div>
        <div className="admin-segmented" role="group" aria-label="Período">
          {(Object.keys(PERIOD_LABELS) as MetricsPeriod[]).map((value) => (
            <button
              key={value}
              type="button"
              className="admin-segmented__option"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {PERIOD_LABELS[value]}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <AdminError message={error} onRetry={() => setAttempt((value) => value + 1)} />
      ) : !current ? (
        <LoadingState message="Cargando el resumen..." />
      ) : (
        <>
          <dl className="admin-stats">
            <div className="admin-stat">
              <dt>Usuarios</dt>
              <dd>{current.users.total}</dd>
            </div>
            <div className="admin-stat">
              <dt>Activos</dt>
              <dd>{current.users.active}</dd>
            </div>
            <div className="admin-stat">
              <dt>Bloqueados</dt>
              <dd>{current.users.blocked}</dd>
            </div>
            <div className="admin-stat">
              <dt>Nuevos ({PERIOD_LABELS[period].toLowerCase()})</dt>
              <dd>{current.users.new_in_period}</dd>
            </div>
          </dl>

          <div className="admin-card">
            <h2>Volumen por moneda</h2>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Moneda</th>
                    <th scope="col">Depósitos</th>
                    <th scope="col">Cambios</th>
                    <th scope="col">Transferencias</th>
                  </tr>
                </thead>
                <tbody>
                  {current.volume.map((row) => (
                    <tr key={row.currency}>
                      <th scope="row">{CURRENCY_NAMES[row.currency]} ({row.currency})</th>
                      <td>{formatMoney(row.deposits, row.currency)}</td>
                      <td>{formatMoney(row.exchanges, row.currency)}</td>
                      <td>{formatMoney(row.transfers, row.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="admin-card__note">
              Los cambios se cuentan en la moneda de origen y cada transferencia una sola vez.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
