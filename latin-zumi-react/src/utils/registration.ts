export const NAME_MAX_LENGTH = 30;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

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
  return Object.values(getPasswordRequirements(value)).every(Boolean);
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
