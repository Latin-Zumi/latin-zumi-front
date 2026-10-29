import { describe, expect, it } from 'vitest';
import {
  getPasswordLengthMessage,
  getPasswordRequirements,
  hasDisallowedNameCharacters,
  meetsPasswordRequirements,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  sanitizeName,
} from '../../src/utils/registration';

describe('requisitos de la contraseña', () => {
  it('acepta una contraseña con largo mínimo, mayúscula y carácter especial', () => {
    expect(meetsPasswordRequirements('LatinZumi1!')).toBe(true);
  });

  it('informa qué requisito falta', () => {
    expect(getPasswordRequirements('latinzumi1!')).toEqual({
      hasMinimumLength: true,
      hasUppercase: false,
      hasSpecialCharacter: true,
    });
    expect(getPasswordRequirements('LatinZumi1')).toMatchObject({ hasSpecialCharacter: false });
    expect(getPasswordRequirements('Lz!')).toMatchObject({ hasMinimumLength: false });
  });

  it('reconoce mayúsculas con tilde y símbolos como especiales', () => {
    expect(getPasswordRequirements('Ñandú$$$')).toMatchObject({
      hasUppercase: true,
      hasSpecialCharacter: true,
    });
  });

  it('rechaza una contraseña que es solo espacios', () => {
    expect(meetsPasswordRequirements(' '.repeat(PASSWORD_MIN_LENGTH))).toBe(false);
  });

  it('dice cuántos caracteres faltan, en singular o plural', () => {
    expect(getPasswordLengthMessage(PASSWORD_MIN_LENGTH - 3)).toBe('faltan 3 caracteres');
    expect(getPasswordLengthMessage(PASSWORD_MIN_LENGTH - 1)).toBe('faltan 1 carácter');
    expect(getPasswordLengthMessage(PASSWORD_MIN_LENGTH)).toBe('');
  });
});

describe('nombre', () => {
  it('saca números y símbolos, pero deja tildes, apóstrofos y guiones', () => {
    expect(sanitizeName('José María 2!')).toBe('José María ');
    expect(sanitizeName("D'Angelo-Pérez")).toBe("D'Angelo-Pérez");
  });

  it('saca espacios al principio, junta los repetidos y corta en el máximo', () => {
    expect(sanitizeName('   Ana   Paula')).toBe('Ana Paula');
    expect(sanitizeName('a'.repeat(NAME_MAX_LENGTH + 5))).toHaveLength(NAME_MAX_LENGTH);
  });

  it('detecta caracteres no permitidos', () => {
    expect(hasDisallowedNameCharacters('Valentina')).toBe(false);
    expect(hasDisallowedNameCharacters('Valentina99')).toBe(true);
  });
});
