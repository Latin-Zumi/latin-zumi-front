import { z } from 'zod';
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../utils/registration';

export const PAISES = ['Argentina', 'Colombia', 'Otro'];

export const nombreSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(NAME_MAX_LENGTH, `El nombre no puede superar los ${NAME_MAX_LENGTH} caracteres`)
  .regex(
    /^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u,
    'Usá solo letras, espacios, apóstrofe o guion',
  );

export const paisSchema = z
  .string()
  .refine((value) => PAISES.includes(value), 'Elegí un país');

export const emailSchema = z
  .string()
  .min(1, 'Ingresá tu email')
  .max(EMAIL_MAX_LENGTH, `El email no puede superar los ${EMAIL_MAX_LENGTH} caracteres`)
  .refine((value) => !/\s/u.test(value), 'El email no puede contener espacios')
  .email('Ingresá un email válido');

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`,
  )
  .refine((value) => /\p{Lu}/u.test(value), 'Incluí al menos una mayúscula')
  .refine(
    (value) => /[\p{P}\p{S}]/u.test(value),
    'Incluí al menos un carácter especial',
  )
  .refine(
    (value) => value.trim().length > 0,
    'La contraseña no puede contener solo espacios',
  );

export const registerSchema = z.object({
  nombre: nombreSchema,
  email: emailSchema,
  pais: paisSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Ingresá tu contraseña')
    .max(
      PASSWORD_MAX_LENGTH,
      `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`,
    ),
});