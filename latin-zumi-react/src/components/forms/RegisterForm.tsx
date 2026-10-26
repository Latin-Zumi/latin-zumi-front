import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { AuthError, register, type Session } from '../../services/authService';
import Button from '../ui/Button';
import Input from '../ui/Input';

const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'Ingresá tu nombre')
    .max(50, 'El nombre no puede superar los 50 caracteres')
    .regex(
      /^[\p{L}\p{M}]+(?:[ '\u2019\u002D\u00B7.][\p{L}\p{M}]+)*$/u,
      'Ingresá un nombre válido, sin números',
    ),
  email: z
    .string()
    .min(1, 'Ingresá tu email')
    .refine((value) => !/\s/u.test(value), 'El email no puede contener espacios')
    .email('Ingresá un email válido'),
  pais: z
    .string()
    .refine(
      (value) => ['Argentina', 'Colombia', 'Otro'].includes(value),
      'Elegí un país válido',
    ),
  password: z
    .string()
    .min(6, 'Mínimo 6 caracteres')
    .refine(
      (value) => value.trim().length > 0,
      'La contraseña no puede contener solo espacios',
    ),
});

type FieldErrors = Partial<
  Record<'nombre' | 'email' | 'pais' | 'password', string>
>;

interface RegisterFormProps {
  onSuccess?: (session: Session) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    pais: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FieldErrors, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;

      const result = registerSchema.shape[field].safeParse(value);
      if (result.success) {
        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      }

      return {
        ...currentErrors,
        [field]: result.error.issues[0]?.message,
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const result = registerSchema.safeParse(form);
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
      const session = await register(result.data);
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
        id="nombre"
        label="Nombre"
        autoComplete="name"
        value={form.nombre}
        disabled={loading}
        error={fieldErrors.nombre}
        onChange={(e) => updateField('nombre', e.target.value)}
      />

      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={form.email}
        disabled={loading}
        error={fieldErrors.email}
        onChange={(e) => updateField('email', e.target.value)}
      />

      <div className="input-container">
        <label htmlFor="pais" className="input-label">
          País
        </label>
        <select
          id="pais"
          value={form.pais}
          className={fieldErrors.pais ? 'input-field--error' : undefined}
          disabled={loading}
          aria-invalid={!!fieldErrors.pais}
          aria-describedby={fieldErrors.pais ? 'pais-error' : undefined}
          onChange={(e) => updateField('pais', e.target.value)}
        >
          <option value="">Elegí un país</option>
          <option value="Argentina">Argentina</option>
          <option value="Colombia">Colombia</option>
          <option value="Otro">Otro</option>
        </select>
        {fieldErrors.pais && (
          <span id="pais-error" className="input-error" role="alert">
            {fieldErrors.pais}
          </span>
        )}
      </div>

      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        value={form.password}
        disabled={loading}
        error={fieldErrors.password}
        onChange={(e) => updateField('password', e.target.value)}
      />

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <Button variant="solid" type="submit" loading={loading}>
        Crear cuenta
      </Button>
    </form>
  );
}