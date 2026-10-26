import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { AuthError, login, type Session } from '../../services/authService';
import Button from '../ui/Button';
import Input from '../ui/Input';

const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={form.email}
        disabled={loading}
        error={fieldErrors.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={form.password}
        disabled={loading}
        error={fieldErrors.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <Button variant="solid" type="submit" loading={loading}>
        Ingresar
      </Button>
    </form>
  );
}