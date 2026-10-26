export type SpinnerSize = "sm" | "md" | "lg";

type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
};

export function Spinner({ size = "md", label = "Cargando" }: SpinnerProps) {
  return (
    <span
      className={`ui-spinner ui-spinner--${size}`}
      role="status"
      aria-label={label}
    />
  );
}

export default Spinner;