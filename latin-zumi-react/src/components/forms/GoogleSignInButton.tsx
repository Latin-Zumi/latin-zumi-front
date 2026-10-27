import { useState } from 'react';
import {
  AuthError,
  AuthUnavailableError,
  loginWithGoogle,
  type Session,
} from '../../services/authService';

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onSuccess?: (session: Session) => void;
}

// Se usa dentro de un <form>: el divisor, el botón y el mensaje quedan como hijos directos
export default function GoogleSignInButton({
  disabled,
  onBusyChange,
  onSuccess,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const setBusy = (busy: boolean) => {
    setLoading(busy);
    onBusyChange?.(busy);
  };

  const handleClick = async () => {
    if (loading || disabled) return;
    setError('');
    setNotice('');
    setBusy(true);

    try {
      const session = await loginWithGoogle();
      if (session) onSuccess?.(session);
    } catch (err) {
      if (err instanceof AuthUnavailableError) {
        setNotice(err.message);
      } else {
        setError(
          err instanceof AuthError
            ? err.message
            : 'Ocurrió un error inesperado. Probá de nuevo.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="auth-divider" aria-hidden="true">
        <span>o</span>
      </div>

      <button
        className="btn btn-lg auth-google-button"
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading ? (
          'Conectando con Google...'
        ) : (
          <>
            <span className="auth-google-button__icon" aria-hidden="true">
              G
            </span>
            Continuar con Google
          </>
        )}
      </button>

      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="form-error form-error--google" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
