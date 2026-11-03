import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import NewPasswordFields from '../components/forms/NewPasswordFields';
import {
  validateNewPassword,
  type NewPasswordErrors,
  type NewPasswordValues,
} from '../components/forms/schemas';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/auth';
import { AuthError, SessionExpiredError, changePassword } from '../services/authService';
import { LOGIN_PASSWORD_MAX_LENGTH } from '../utils/registration';

// Se llega desde el navbar o, si la contraseña es vieja, obligado por ProtectedRoute
export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, passwordChangeRequired, completePasswordChange, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [currentError, setCurrentError] = useState('');
  const [values, setValues] = useState<NewPasswordValues>({ password: '', confirmation: '' });
  const [errors, setErrors] = useState<NewPasswordErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setFormError('');

    const nextErrors = validateNewPassword(values);
    setErrors(nextErrors);
    setCurrentError(current ? '' : 'Ingresá tu contraseña actual');
    if (!current || Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await changePassword(current, values.password);
      completePasswordChange();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        await logout();
        return;
      }
      setFormError(
        error instanceof AuthError ? error.message : 'No pudimos cambiar la contraseña. Probá de nuevo.',
      );
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="change-password-title">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">LATIN ZUMI · SEGURIDAD</span>
          <h1 id="change-password-title">Cambiar contraseña</h1>
          <p>
            {passwordChangeRequired
              ? 'Tu contraseña es de un formato anterior. Para seguir usando tu billetera, elegí una nueva.'
              : 'Al cambiarla, cerramos las sesiones abiertas en otros dispositivos.'}
          </p>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)} noValidate>
          <Input
            id="current-password"
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={current}
            maxLength={LOGIN_PASSWORD_MAX_LENGTH}
            disabled={loading}
            error={currentError}
            onChange={(event) => {
              setCurrent(event.target.value);
              setCurrentError('');
            }}
          />
          <NewPasswordFields values={values} errors={errors} disabled={loading} onChange={setValues} />
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <Button variant="solid" type="submit" loading={loading}>
            Cambiar contraseña
          </Button>
        </form>

        <p className="auth-card__footer">
          {passwordChangeRequired ? (
            <button type="button" className="auth-card__text-button" onClick={() => void logout()}>
              Salir
            </button>
          ) : (
            <Link to="/dashboard">Volver a mi billetera</Link>
          )}
        </p>
      </section>
    </main>
  );
}
