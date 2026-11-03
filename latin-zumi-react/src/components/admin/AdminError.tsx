import Button from '../ui/Button';

// ErrorState habla de la billetera; el panel necesita su propio mensaje
export default function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-container" role="alert">
      <p>{message}</p>
      {onRetry && (
        <Button variant="solid" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
