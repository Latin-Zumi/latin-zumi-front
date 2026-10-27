import { useState, type FormEvent } from 'react';
import { AuthError, register, type Session } from '../../services/authService';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import {
  EMAIL_MAX_LENGTH,
  hasDisallowedNameCharacters,
  getPasswordRequirements,
  getPasswordLengthMessage,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  sanitizeName,
} from '../../utils/registration';
import Button from '../ui/Button';
import Input from '../ui/Input';
import GoogleSignInButton from './GoogleSignInButton';
import { PAISES, registerSchema } from './schemas';

type RegisterFields = {
  nombre: string;
  email: string;
  pais: string;
  password: string;
};

const REGISTER_FIELDS: (keyof RegisterFields)[] = [
  'nombre',
  'email',
  'pais',
  'password',
];

interface RegisterFormProps {
  onSuccess?: (session: Session) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const validation = useFieldValidation<RegisterFields>(
    { nombre: '', email: '', pais: '', password: '' },
    (field, value) => {
      const result = registerSchema.shape[field].safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  );
  const [formError, setFormError] = useState('');
  const [nameNotice, setNameNotice] = useState('');
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isSubmitting = loading || googleLoading;
  const passwordLengthMessage = getPasswordLengthMessage(
    validation.values.password.length,
  );
  const passwordRequirements = getPasswordRequirements(validation.values.password);
  const passwordChecklist = [
    {
      label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
      met: passwordRequirements.hasMinimumLength,
      hint: passwordLengthMessage,
    },
    { label: 'Incluir una mayúscula', met: passwordRequirements.hasUppercase },
    { label: 'Incluir un carácter especial', met: passwordRequirements.hasSpecialCharacter },
  ];
  const metRequirements = passwordChecklist.filter((item) => item.met).length;
  const showPasswordFeedback = validation.touched.password;

  const updateName = (value: string) => {
    const containsDisallowed = hasDisallowedNameCharacters(value);
    const sanitized = sanitizeName(value);
    setNameNotice(
      containsDisallowed
        ? 'El nombre no puede contener números ni símbolos'
        : '',
    );
    validation.updateField('nombre', sanitized);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    const result = registerSchema.safeParse(validation.values);
    if (!result.success) {
      const errors: Partial<Record<keyof RegisterFields, string>> = {};
      for (const issue of result.error.issues) {
        const field = REGISTER_FIELDS.find(
          (candidate) => candidate === issue.path[0],
        );
        if (field && !errors[field]) errors[field] = issue.message;
      }
      validation.setErrors(errors);
      validation.markAllTouched();
      setEmailBlurred(true);
      const firstInvalid = REGISTER_FIELDS.find((field) => errors[field]);
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }

    validation.setErrors({});
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
        value={validation.values.nombre}
        maxLength={NAME_MAX_LENGTH}
        disabled={isSubmitting}
        error={validation.errors.nombre}
        notice={nameNotice}
        onChange={(event) => updateName(event.target.value)}
        onBlur={() => validation.blurField('nombre')}
      />

      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={validation.values.email}
        maxLength={EMAIL_MAX_LENGTH}
        disabled={isSubmitting}
        error={emailBlurred ? validation.errors.email : undefined}
        onChange={(event) =>
          validation.updateField('email', event.target.value, emailBlurred)
        }
        onBlur={() => {
          setEmailBlurred(true);
          validation.blurField('email');
        }}
      />

      <div className="input-container">
        <label htmlFor="pais" className="input-label">
          País
        </label>
        <select
          id="pais"
          value={validation.values.pais}
          className={validation.errors.pais ? 'input-field--error' : undefined}
          disabled={isSubmitting}
          aria-invalid={!!validation.errors.pais}
          aria-describedby={validation.errors.pais ? 'pais-error' : undefined}
          onChange={(event) => validation.updateField('pais', event.target.value)}
          onBlur={() => validation.blurField('pais')}
        >
          <option value="">Elegí un país</option>
          {PAISES.map((pais) => (
            <option key={pais} value={pais}>{pais}</option>
          ))}
        </select>
        {validation.errors.pais && (
          <span id="pais-error" className="input-error">
            {validation.errors.pais}
          </span>
        )}
      </div>

      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        value={validation.values.password}
        maxLength={PASSWORD_MAX_LENGTH}
        disabled={isSubmitting}
        error={validation.errors.password}
        aria-describedby={showPasswordFeedback ? 'password-feedback' : undefined}
        onChange={(event) =>
          validation.updateField('password', event.target.value)
        }
        onBlur={() => validation.blurField('password')}
      />
      {showPasswordFeedback && (
        <div id="password-feedback" className="mb-4">
          <ul className="flex list-none flex-col gap-1 text-sm text-muted">
            {passwordChecklist.map((item) => (
              <li key={item.label} className={item.met ? 'text-success' : undefined}>
                <span aria-hidden="true">{item.met ? '✓' : '○'}</span>
                {' '}{item.label}
                {item.hint && ` (${item.hint})`}
                <span className="sr-only">{item.met ? ', cumplido' : ', pendiente'}</span>
              </li>
            ))}
          </ul>
          {/* Solo cambia cuando cambia la cantidad cumplida, así no se anuncia en cada tecla */}
          <p className="sr-only" aria-live="polite">
            {metRequirements} de {passwordChecklist.length} requisitos cumplidos
          </p>
        </div>
      )}

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <Button variant="solid" type="submit" loading={loading} disabled={googleLoading}>
        Crear cuenta
      </Button>

      <GoogleSignInButton
        disabled={loading}
        onBusyChange={setGoogleLoading}
        onSuccess={onSuccess}
      />
    </form>
  );
}
