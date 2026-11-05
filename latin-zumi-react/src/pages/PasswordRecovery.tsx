import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { emailSchema } from '../components/forms/schemas';
import { AuthError, forgotPassword } from '../services/authService';

export default function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setFormError('');

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Ingresá un email válido.');
      return;
    }

    setEmailError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof AuthError ? error.message : 'No pudimos enviar el pedido. Probá de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="password-recovery-title">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">LATIN ZUMI · AYUDA</span>
          <h1 id="password-recovery-title">Recuperar contraseña</h1>
          <p>
            Ingresá el correo electrónico asociado a tu cuenta y te enviaremos
            las instrucciones para restablecer tu contraseña.
          </p>
        </header>

        {sent ? (
          // El mismo mensaje exista o no la cuenta, para no revelar qué emails están registrados
          <p className="form-notice" role="status">
            Si {email.trim()} está registrado, te enviamos un correo con un enlace para
            restablecer tu contraseña. Usalo pronto: el correo indica cuándo vence.
          </p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} noValidate>
            <Input
              id="recovery-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              maxLength={254}
              disabled={loading}
              error={emailError}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError('');
              }}
              onBlur={() => {
                if (!email) return;
                const result = emailSchema.safeParse(email);
                setEmailError(
                  result.success
                    ? ''
                    : result.error.issues[0]?.message ?? 'Ingresá un email válido.',
                );
              }}
            />

            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}

            <Button variant="solid" type="submit" loading={loading}>
              Enviar instrucciones
            </Button>
          </form>
        )}

        <p className="auth-card__footer">
          <Link to="/login">Volver al login</Link>
        </p>
      </section>
    </main>
  );
}
