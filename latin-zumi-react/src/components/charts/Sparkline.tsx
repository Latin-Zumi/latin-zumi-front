import type { RatePoint } from "../../services/ratesService";

type SparklineProps = {
  points: RatePoint[];
  trend: "up" | "down";
  width?: number;
  height?: number;
};

export function Sparkline({ points, trend, width = 120, height = 36 }: SparklineProps) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;

  const coords = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    pad + (1 - (v - min) / range) * (height - pad * 2),
  ]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      className={`sparkline sparkline--${trend}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      overflow="visible"
    >
      <path d={`${line}L${width},${height}L0,${height}Z`} className="sparkline__area" />
      <path d={line} className="sparkline__line" />
      <circle cx={lastX} cy={lastY} r={3} className="sparkline__dot" />
    </svg>
  );
}

export default Sparkline;
