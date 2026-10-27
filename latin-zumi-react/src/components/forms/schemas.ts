import { z } from 'zod';

export const PAISES = ['Argentina', 'Colombia', 'Otro'];

export const nombreSchema = z
  .string()
  .trim()
  .min(2, 'Ingresá tu nombre')
  .max(50, 'El nombre no puede superar los 50 caracteres')
  .regex(
    /^[\p{L}\p{M}]+(?:[ '\u2019\u002D\u00B7.][\p{L}\p{M}]+)*$/u,
    'Ingresá un nombre válido, sin números',
  );

export const paisSchema = z
  .string()
  .refine((value) => PAISES.includes(value), 'Elegí un país válido');

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Ingresá tu email')
    .max(254, 'El email no puede superar los 254 caracteres')
    .refine((value) => !/\s/u.test(value), 'El email no puede contener espacios')
    .email('Ingresá un email válido'),
  password: z
    .string()
    .min(1, 'Ingresá tu contraseña')
    .max(72, 'La contraseña no puede superar los 72 caracteres'),
});
