import Button from "../ui/Button";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="state-container" role="alert">
    <p>Error en la billetera: {message}</p>
    {onRetry && (
      <Button variant="solid" onClick={onRetry}>
        Reintentar
      </Button>
    )}
  </div>
);
