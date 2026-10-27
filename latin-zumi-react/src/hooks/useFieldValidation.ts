import { useState } from 'react';

export type FieldErrors<T extends Record<string, string>> = Partial<
  Record<keyof T, string>
>;

export function useFieldValidation<T extends Record<string, string>>(
  initialValues: T,
  validateField: (field: keyof T, value: string) => string | undefined,
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  function updateField(
    field: keyof T,
    value: string,
    validateOnChange = true,
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));

    if (validateOnChange) {
      const error = validateField(field, value);
      setErrors((current) => {
        const next = { ...current };
        if (error) next[field] = error;
        else delete next[field];
        return next;
      });
    }
  }

  function blurField(field: keyof T) {
    setTouched((current) => ({ ...current, [field]: true }));
    const error = validateField(field, values[field]);
    setErrors((current) => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  }

  function markAllTouched() {
    setTouched(
      Object.fromEntries(
        Object.keys(values).map((field) => [field, true]),
      ) as Partial<Record<keyof T, boolean>>,
    );
  }

  return {
    values,
    errors,
    touched,
    setErrors,
    updateField,
    blurField,
    markAllTouched,
  };
}
