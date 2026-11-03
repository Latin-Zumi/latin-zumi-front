import { useState } from 'react';
import { PASSWORD_MAX_LENGTH } from '../../utils/registration';
import Input from '../ui/Input';
import PasswordChecklist from './PasswordChecklist';
import type { NewPasswordErrors, NewPasswordValues } from './schemas';

interface NewPasswordFieldsProps {
  values: NewPasswordValues;
  errors: NewPasswordErrors;
  disabled?: boolean;
  onChange: (values: NewPasswordValues) => void;
}

// Contraseña nueva con sus requisitos y la confirmación: restablecer y cambiar contraseña
export default function NewPasswordFields({ values, errors, disabled, onChange }: NewPasswordFieldsProps) {
  const [touched, setTouched] = useState(false);

  return (
    <>
      <Input
        id="new-password"
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        value={values.password}
        maxLength={PASSWORD_MAX_LENGTH}
        disabled={disabled}
        error={errors.password}
        aria-describedby={touched ? 'new-password-feedback' : undefined}
        onChange={(event) => {
          setTouched(true);
          onChange({ ...values, password: event.target.value });
        }}
      />
      {touched && <PasswordChecklist id="new-password-feedback" value={values.password} />}
      <Input
        id="new-password-confirmation"
        label="Repetí la contraseña nueva"
        type="password"
        autoComplete="new-password"
        value={values.confirmation}
        maxLength={PASSWORD_MAX_LENGTH}
        disabled={disabled}
        error={errors.confirmation}
        onChange={(event) => onChange({ ...values, confirmation: event.target.value })}
      />
    </>
  );
}
