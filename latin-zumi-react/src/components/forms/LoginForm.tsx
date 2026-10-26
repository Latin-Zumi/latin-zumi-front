import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { AuthError, login, type Session } from '../../services/authService';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .refine((value) => value.trim().length > 0, 'El email es obligatorio')
    .email('Ingresá un email válido'),
  password: z
    .string()
    .refine(
      (value) => value.trim().length > 0,
      'La contraseña es obligatoria',
    ),
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

  const handleChange = (field: keyof FieldErrors, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');

    const result = loginSchema.shape[field].safeParse(value);
    setFieldErrors((current) => {
      const next = { ...current };
      if (result.success) {
        delete next[field];
      } else {
        next[field] = result.error.issues[0].message;
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        {fieldErrors.email && (
          <p id="email-error" role="alert">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? 'password-error' : undefined
          }
          value={form.password}
          onChange={(e) => handleChange('password', e.target.value)}
        />
        {fieldErrors.password && (
          <p id="password-error" role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {formError && <p role="alert">{formError}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}