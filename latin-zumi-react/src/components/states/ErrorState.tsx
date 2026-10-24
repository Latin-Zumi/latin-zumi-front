type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="state-container" role="alert">
    <p>Error en la billetera: {message}</p>
    {onRetry && <button onClick={onRetry}>Reintentar</button>}
  </div>
);
