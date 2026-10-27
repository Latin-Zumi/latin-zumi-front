export const NAME_MAX_LENGTH = 30;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordRequirements {
  hasMinimumLength: boolean;
  hasMaximumLength: boolean;
  hasUppercase: boolean;
  hasSpecialCharacter: boolean;
}

export function getPasswordRequirements(value: string): PasswordRequirements {
  return {
    hasMinimumLength: value.length >= PASSWORD_MIN_LENGTH,
    hasMaximumLength: value.length <= PASSWORD_MAX_LENGTH,
    hasUppercase: /\p{Lu}/u.test(value),
    hasSpecialCharacter: /[\p{P}\p{S}]/u.test(value),
  };
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

export function getPasswordLengthMessage(length: number): string {
  if (length < PASSWORD_MIN_LENGTH) {
    const remaining = PASSWORD_MIN_LENGTH - length;
    return `Faltan ${remaining} ${remaining === 1 ? 'carácter' : 'caracteres'}`;
  }
  if (length > PASSWORD_MAX_LENGTH) {
    const excess = length - PASSWORD_MAX_LENGTH;
    return `Sobran ${excess} ${excess === 1 ? 'carácter' : 'caracteres'}`;
  }
  return '';
}
