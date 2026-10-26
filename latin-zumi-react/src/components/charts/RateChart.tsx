import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatRate, type RatePoint } from "../../services/ratesService";

type RateChartProps = {
  points: RatePoint[];
  label: string;
  height?: number;
};

const PAD = { top: 16, right: 16, bottom: 28, left: 64 };
const TICKS = 4;

const formatDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

export function RateChart({ points, label, height = 260 }: RateChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const margin = (rawMax - rawMin) * 0.1 || rawMax * 0.01;
  const min = rawMin - margin;
  const max = rawMax + margin;

  const plotW = Math.max(width - PAD.left - PAD.right, 10);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const baseY = PAD.top + plotH;
  const area = `${line}L${x(points.length - 1)},${baseY}L${x(0)},${baseY}Z`;

  const yTicks = Array.from({ length: TICKS }, (_, i) => min + ((max - min) * i) / (TICKS - 1));
  const xTickCount = width < 480 ? 3 : 5;
  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i * (points.length - 1)) / (xTickCount - 1)),
  );

  const handlePointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = Math.round((px / plotW) * (points.length - 1));
    setActive(Math.min(Math.max(i, 0), points.length - 1));
  };

  const handleKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    setActive((prev) => Math.min(Math.max((prev ?? points.length - 1) + step, 0), points.length - 1));
  };

  const last = points.length - 1;
  const current = active !== null ? points[active] : null;
  const tooltipLeft = active !== null ? Math.min(Math.max(x(active), 70), width - 70) : 0;

  return (
    <div className="rate-chart" ref={wrapRef}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${label}. Usá las flechas para recorrer los valores.`}
        tabIndex={0}
        onPointerMove={handlePointer}
        onPointerLeave={() => setActive(null)}
        onKeyDown={handleKey}
        onBlur={() => setActive(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="rate-chart__grid" />
            <text x={PAD.left - 8} y={y(t)} className="rate-chart__tick" textAnchor="end" dominantBaseline="middle">
              {formatRate(t)}
            </text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 8}
            className="rate-chart__tick"
            textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
          >
            {formatDay(points[i].date)}
          </text>
        ))}

        <path d={area} className="rate-chart__area" />
        <path d={line} className="rate-chart__line" />

        {active === null ? (
          <circle cx={x(last)} cy={y(points[last].value)} r={5} className="rate-chart__dot" />
        ) : (
          <>
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={baseY} className="rate-chart__crosshair" />
            <circle cx={x(active)} cy={y(points[active].value)} r={5} className="rate-chart__dot" />
          </>
        )}
      </svg>

      {current && (
        <div className="rate-chart__tooltip" style={{ left: tooltipLeft }} aria-live="polite">
          <span className="rate-chart__tooltip-date">{formatDay(current.date)}</span>
          <strong>{formatRate(current.value)}</strong>
        </div>
      )}
    </div>
  );
}

export default RateChart;
