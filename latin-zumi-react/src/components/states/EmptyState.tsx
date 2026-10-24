import Button from "../ui/Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "no-transactions" | "no-balance";
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  variant,
}) => (
  <div className="state-container" role="status" aria-live="polite">
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {variant === "no-transactions" && (
      <p>Todavía no realizaste ninguna transacción en tu billetera.</p>
    )}
    {variant === "no-balance" && (
      <p>No tenés fondos disponibles en tu billetera.</p>
    )}
    {actionLabel && onAction && (
      <Button variant="solid" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);
