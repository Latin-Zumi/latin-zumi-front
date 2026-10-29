export const NAME_MAX_LENGTH = 30;
export const EMAIL_MAX_LENGTH = 254;
// Límites del registro definidos por el equipo de front. Ojo: el backend hoy exige
// de 15 a 128, así que una contraseña de 8 a 14 pasa el formulario y vuelve con 400.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 24;
// El login acepta contraseñas más largas para no bloquear cuentas creadas con el límite del backend
export const LOGIN_PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'La contraseña no cumple los requisitos necesarios';

export interface PasswordRequirements {
  hasMinimumLength: boolean;
  hasUppercase: boolean;
  hasSpecialCharacter: boolean;
}

export function getPasswordRequirements(value: string): PasswordRequirements {
  return {
    hasMinimumLength: value.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /\p{Lu}/u.test(value),
    hasSpecialCharacter: /[\p{P}\p{S}]/u.test(value),
  };
}

export function meetsPasswordRequirements(value: string): boolean {
  return (
    value.trim().length > 0 &&
    Object.values(getPasswordRequirements(value)).every(Boolean)
  );
}

export function sanitizeName(value: string): string {
  return value
    .replace(/[^\p{L}\p{M} '’-]/gu, '')
    .replace(/^\s+/u, '')
    .replace(/ {2,}/gu, ' ')
    .slice(0, NAME_MAX_LENGTH);
}

export function hasDisallowedNameCharacters(value: string): boolean {
  return /[^\p{L}\p{M} '’-]/u.test(value);
}

// El campo tiene maxLength, así que solo puede faltar longitud, nunca sobrar
export function getPasswordLengthMessage(length: number): string {
  const remaining = PASSWORD_MIN_LENGTH - length;
  if (remaining <= 0) return '';
  return `faltan ${remaining} ${remaining === 1 ? 'carácter' : 'caracteres'}`;
}
