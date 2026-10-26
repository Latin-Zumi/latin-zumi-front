import Sparkline from "../charts/Sparkline";
import {
  formatChange,
  formatRate,
  getChange,
  type QuotedCurrency,
  type RatePoint,
} from "../../services/ratesService";
import { CURRENCY_NAMES } from "../../utils/money";

type RateCardProps = {
  currency: QuotedCurrency;
  points: RatePoint[];
  selected: boolean;
  onSelect: () => void;
};

export function RateCard({ currency, points, selected, onSelect }: RateCardProps) {
  const change = getChange(points);
  const trend = change >= 0 ? "up" : "down";
  const last = points[points.length - 1].value;

  return (
    <button
      type="button"
      className={`rate-card${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="rate-card__head">
        <span className="currency-badge">{currency}</span>
        <span className="rate-card__name">{CURRENCY_NAMES[currency]}</span>
      </div>

      <div className="rate-card__body">
        <div>
          <p className="rate-card__value">{formatRate(last)}</p>
          <p className="rate-card__pair">por 1 USD</p>
        </div>
        <Sparkline points={points} trend={trend} />
      </div>

      <span className={`trend-pill trend-pill--${trend}`}>
        <span aria-hidden="true">{trend === "up" ? "▲" : "▼"}</span>
        {formatChange(change)}
        <span className="sr-only">{trend === "up" ? "sube" : "baja"}</span>
      </span>
    </button>
  );
}

export default RateCard;
