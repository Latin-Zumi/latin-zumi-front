import { useState, type FormEvent } from 'react';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import {
  AuthError,
  login,
  type Session,
} from '../../services/authService';
import { sanitizeLoginEmail } from '../../utils/login';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { GOOGLE_AUTH_ENABLED } from '../../config/features';
import GoogleSignInButton from './GoogleSignInButton';
import { loginSchema } from './schemas';

type LoginFields = {
  email: string;
  password: string;
};

const LOGIN_FIELDS: (keyof LoginFields)[] = ['email', 'password'];

interface LoginFormProps {
  onSuccess?: (session: Session) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const validation = useFieldValidation<LoginFields>(
    { email: '', password: '' },
    (field, value) => {
      const result = loginSchema.shape[field].safeParse(value);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  );
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isSubmitting = loading || googleLoading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    const result = loginSchema.safeParse(validation.values);
    if (!result.success) {
      const errors: Partial<Record<keyof LoginFields, string>> = {};
      for (const issue of result.error.issues) {
        const field = LOGIN_FIELDS.find(
          (candidate) => candidate === issue.path[0],
        );
        if (field && !errors[field]) errors[field] = issue.message;
      }

      validation.setErrors(errors);
      validation.markAllTouched();
      setEmailBlurred(true);
      const firstInvalid = LOGIN_FIELDS.find((field) => errors[field]);
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }

    validation.setErrors({});
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
        value={validation.values.email}
        maxLength={254}
        disabled={isSubmitting}
        error={emailBlurred ? validation.errors.email : undefined}
        onChange={(event) => {
          setFormError('');
          validation.updateField(
            'email',
            sanitizeLoginEmail(event.target.value),
            emailBlurred,
          );
        }}
        onBlur={() => {
          setEmailBlurred(true);
          validation.blurField('email');
        }}
      />

      <Input
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={validation.values.password}
        maxLength={72}
        disabled={isSubmitting}
        error={validation.errors.password}
        onChange={(event) => {
          setFormError('');
          validation.updateField('password', event.target.value);
        }}
        onBlur={() => validation.blurField('password')}
      />

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <Button
        variant="solid"
        type="submit"
        loading={loading}
        disabled={googleLoading}
      >
        Ingresar
      </Button>

      {GOOGLE_AUTH_ENABLED && (
        <GoogleSignInButton
          disabled={loading}
          onBusyChange={setGoogleLoading}
          onSuccess={onSuccess}
        />
      )}
    </form>
  );
}
