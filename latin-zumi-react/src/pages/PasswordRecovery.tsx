import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { emailSchema } from '../components/forms/schemas';

export default function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [recoveryUnavailable, setRecoveryUnavailable] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recoveryUnavailable) return;

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Ingresá un email válido.');
      return;
    }

    setEmailError('');
    setRecoveryUnavailable(true);
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

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="recovery-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            maxLength={254}
            error={emailError}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError('');
              setRecoveryUnavailable(false);
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

          <Button variant="solid" type="submit" disabled={recoveryUnavailable}>
            Enviar instrucciones
          </Button>

          {recoveryUnavailable && (
            <p className="form-error auth-card__recovery-unavailable" role="alert">
              La recuperación todavía no está disponible para las cuentas de Latin
              Zumi. El backend aún no ofrece el proceso para restablecer contraseñas;
              no se envió ningún correo.
            </p>
          )}
        </form>

        <p className="auth-card__footer">
          <Link to="/login">Volver al login</Link>
        </p>
      </section>
    </main>
  );
}
