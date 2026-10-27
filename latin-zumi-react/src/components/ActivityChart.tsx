import type { ActivityDay } from '../utils/dashboard';
import { formatMoney } from '../utils/money';
import type { Currency } from '../types';

interface ActivityChartProps {
  data: ActivityDay[];
  currency: Currency;
}

const CHART_HEIGHT = 150;
const CHART_BASELINE = 184;
const CHART_WIDTH = 600;

function formatDay(date: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export default function ActivityChart({ data, currency }: ActivityChartProps) {
  const maxAmount = Math.max(
    1,
    ...data.flatMap(({ income, expenses }) => [income, expenses]),
  );
  const groupWidth = CHART_WIDTH / data.length;
  const barWidth = Math.min(24, groupWidth / 4);

  return (
    <div className="dashboard-chart">
      <svg
        className="dashboard-chart__svg"
        viewBox={`0 0 ${CHART_WIDTH} 230`}
        role="img"
        aria-label={`Ingresos y gastos de los últimos ${data.length} días, en ${currency}`}
      >
        {[0, 1, 2].map((line) => {
          const y = CHART_BASELINE - (CHART_HEIGHT / 2) * line;
          return (
            <line
              key={line}
              x1="0"
              y1={y}
              x2={CHART_WIDTH}
              y2={y}
              className="dashboard-chart__grid"
            />
          );
        })}
        {data.map((day, index) => {
          const center = groupWidth * index + groupWidth / 2;
          const incomeHeight = (day.income / maxAmount) * CHART_HEIGHT;
          const expenseHeight = (day.expenses / maxAmount) * CHART_HEIGHT;
          return (
            <g key={day.date}>
              <rect
                x={center - barWidth - 2}
                y={CHART_BASELINE - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                rx="4"
                className="dashboard-chart__bar dashboard-chart__bar--income"
              />
              <rect
                x={center + 2}
                y={CHART_BASELINE - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                rx="4"
                className="dashboard-chart__bar dashboard-chart__bar--expense"
              />
              <text
                x={center}
                y="210"
                textAnchor="middle"
                className="dashboard-chart__label"
              >
                {formatDay(day.date)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="dashboard-chart__legend" aria-hidden="true">
        <span><i className="dashboard-chart__swatch dashboard-chart__swatch--income" />Ingresos</span>
        <span><i className="dashboard-chart__swatch dashboard-chart__swatch--expense" />Gastos</span>
      </div>

      <details className="dashboard-chart__table">
        <summary>Ver datos del gráfico como tabla</summary>
        <div className="dashboard-chart__table-wrap">
          <table>
            <caption className="sr-only">
              Ingresos y gastos diarios en {currency}
            </caption>
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col">Ingresos</th>
                <th scope="col">Gastos</th>
              </tr>
            </thead>
            <tbody>
              {data.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{formatDay(day.date)}</th>
                  <td>{formatMoney(day.income, currency)}</td>
                  <td>{formatMoney(day.expenses, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
