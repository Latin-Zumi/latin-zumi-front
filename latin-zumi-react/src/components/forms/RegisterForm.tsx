import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { AuthError, register, type Session } from '../../services/authService';
import Button from '../ui/Button';
import Input from '../ui/Input';

const registerSchema = z.object({
  nombre: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Ingresá un email válido'),
  pais: z.string().min(1, 'Elegí un país'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
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
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
      />

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

      <div className="input-container">
        <label htmlFor="pais" className="input-label">
          País
        </label>
        <select
          id="pais"
          value={form.pais}
          disabled={loading}
          aria-invalid={!!fieldErrors.pais}
          aria-describedby={fieldErrors.pais ? 'pais-error' : undefined}
          onChange={(e) => setForm({ ...form, pais: e.target.value })}
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
        onChange={(e) => setForm({ ...form, password: e.target.value })}
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