import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NewPasswordFields from '../components/forms/NewPasswordFields';
import {
  validateNewPassword,
  type NewPasswordErrors,
  type NewPasswordValues,
} from '../components/forms/schemas';
import Button from '../components/ui/Button';
import { AuthError, ResetTokenError, resetPassword } from '../services/authService';

// A esta página lleva el enlace del email: /restablecer-contrasena?token=...
export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [values, setValues] = useState<NewPasswordValues>({ password: '', confirmation: '' });
  const [errors, setErrors] = useState<NewPasswordErrors>({});
  const [formError, setFormError] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setFormError('');

    const nextErrors = validateNewPassword(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await resetPassword(token, values.password);
      setDone(true);
    } catch (error) {
      if (error instanceof ResetTokenError) setTokenExpired(true);
      setFormError(
        error instanceof AuthError ? error.message : 'No pudimos cambiar la contraseña. Probá de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  let content;
  if (done) {
    content = (
      <>
        <p className="form-notice" role="status">
          Listo, cambiamos tu contraseña. Por seguridad cerramos las sesiones abiertas en otros
          dispositivos.
        </p>
        <Link className="btn btn-md auth-card__action" to="/login">
          Ingresar
        </Link>
      </>
    );
  } else if (!token || tokenExpired) {
    content = (
      <>
        <p className="form-error" role="alert">
          {token ? formError : 'Este enlace no es válido. Pedí uno nuevo para restablecer tu contraseña.'}
        </p>
        <Link className="btn btn-md auth-card__action" to="/recuperar-contrasena">
          Pedir un enlace nuevo
        </Link>
      </>
    );
  } else {
    content = (
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <NewPasswordFields values={values} errors={errors} disabled={loading} onChange={setValues} />
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <Button variant="solid" type="submit" loading={loading}>
          Guardar contraseña
        </Button>
      </form>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="password-reset-title">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">LATIN ZUMI · AYUDA</span>
          <h1 id="password-reset-title">Nueva contraseña</h1>
          <p>Elegí una contraseña nueva para tu cuenta.</p>
        </header>

        {content}

        {!done && (
          <p className="auth-card__footer">
            <Link to="/login">Volver al login</Link>
          </p>
        )}
      </section>
    </main>
  );
}
