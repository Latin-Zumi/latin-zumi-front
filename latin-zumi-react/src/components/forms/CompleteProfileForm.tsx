import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import type { AuthUser } from '../../services/authService';
import { ProfileError, updateProfile } from '../../services/userService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PAISES, nombreSchema, paisSchema } from './schemas';

type FieldErrors = Partial<Record<'nombre' | 'pais', string>>;

interface CompleteProfileFormProps {
  askNombre: boolean;
  onSuccess?: (user: AuthUser) => void;
}

export default function CompleteProfileForm({ askNombre, onSuccess }: CompleteProfileFormProps) {
  const [form, setForm] = useState({ nombre: '', pais: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    nombre: askNombre ? nombreSchema : z.string(),
    pais: paisSchema,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setFormError('');

    const result = schema.safeParse(form);
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
      const user = await updateProfile({
        pais: result.data.pais,
        ...(askNombre && { nombre: result.data.nombre }),
      });
      onSuccess?.(user);
    } catch (error) {
      setFormError(
        error instanceof ProfileError
          ? error.message
          : 'Ocurrió un error inesperado. Probá de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {askNombre && (
        <Input
          id="nombre"
          label="Nombre"
          autoComplete="name"
          value={form.nombre}
          disabled={loading}
          error={fieldErrors.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
      )}

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
          onChange={(e) => setForm({ ...form, pais: e.target.value })}
        >
          <option value="">Elegí un país</option>
          {PAISES.map((pais) => (
            <option key={pais} value={pais}>{pais}</option>
          ))}
        </select>
        {fieldErrors.pais && (
          <span id="pais-error" className="input-error" role="alert">
            {fieldErrors.pais}
          </span>
        )}
      </div>

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <Button variant="solid" type="submit" loading={loading}>
        Guardar y continuar
      </Button>
    </form>
  );
}
