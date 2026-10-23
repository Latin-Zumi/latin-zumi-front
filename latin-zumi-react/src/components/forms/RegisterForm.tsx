import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { AuthError, register, type Session } from '../../services/authService';

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
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          autoComplete="name"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        {fieldErrors.nombre && <p role="alert">{fieldErrors.nombre}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {fieldErrors.email && <p role="alert">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="pais">País</label>
        <select
          id="pais"
          value={form.pais}
          onChange={(e) => setForm({ ...form, pais: e.target.value })}
        >
          <option value="">Elegí un país</option>
          <option value="Argentina">Argentina</option>
          <option value="Colombia">Colombia</option>
          <option value="Otro">Otro</option>
        </select>
        {fieldErrors.pais && <p role="alert">{fieldErrors.pais}</p>}
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {fieldErrors.password && <p role="alert">{fieldErrors.password}</p>}
      </div>

      {formError && <p role="alert">{formError}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  );
}