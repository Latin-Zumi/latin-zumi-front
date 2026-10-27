import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import {
  AuthError,
  login,
  loginWithGoogle,
  type Session,
} from '../../services/authService';
import Button from '../ui/Button';
import Input from '../ui/Input';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .max(254, 'El email es demasiado largo')
    .email('Ingresá un email válido'),
  password: z
    .string()
    .min(1, 'Ingresá tu contraseña')
    .min(6, 'Mínimo 6 caracteres')
    .max(72, 'Máximo 72 caracteres'),
});

type FieldErrors = Partial<Record<'email' | 'password', string>>;

interface LoginFormProps {
  onSuccess?: (session: Session) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isSubmitting = loading || googleLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const session = await login(result.data);
      onSuccess?.(session);
    } catch (error) {
      setFormError(
        error instanceof AuthError
          ? error.message
          : 'Ocurrió un error inesperado. Probá de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setFormError('');
    setGoogleLoading(true);

    try {
      const session = await loginWithGoogle();
      if (session) onSuccess?.(session);
    } catch (error) {
      setFormError(
        error instanceof AuthError
          ? error.message
          : 'Ocurrió un error inesperado. Probá de nuevo.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={form.email}
        disabled={isSubmitting}
        error={fieldErrors.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={form.password}
        disabled={isSubmitting}
        error={fieldErrors.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <Button variant="solid" type="submit" loading={loading} disabled={googleLoading}>
        Ingresar
      </Button>

      <div className="auth-divider" aria-hidden="true">
        <span>o</span>
      </div>

      <button
        className="btn btn-lg auth-google-button"
        type="button"
        onClick={() => void handleGoogleSignIn()}
        disabled={isSubmitting}
        aria-busy={googleLoading || undefined}
      >
        {googleLoading ? (
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
    </form>
  );
}