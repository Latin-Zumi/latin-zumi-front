# Spec: Textos del panel, la recuperación y las cuentas de prueba

## Fecha
2026-11-05

## Problema
Tres textos ya no coinciden con lo que hace la app:

- El panel de admin dice que un cambio de interés vale desde el día siguiente, pero el back acredita con la tasa vigente al correr el proceso.
- La recuperación de contraseña dice que el enlace vence a los pocos minutos, y ahora dura 60 por defecto.
- El documento de cuentas de prueba habla de un cambio de moneda con comisión, y la comisión está en 0 %.

## Solución propuesta
- **Panel:** "Se acredita una vez por día, con la tasa vigente al momento de acreditar."
- **Recuperación:** "Usalo pronto: el correo indica cuándo vence." La duración se configura en el back y el correo ya la informa, así que el front no fija un número.
- **Cuentas de prueba:** sacar "con comisión".

## Archivos afectados
- `latin-zumi-react/src/pages/admin/AdminSettings.tsx`
- `latin-zumi-react/src/pages/PasswordRecovery.tsx`
- `docs/specs/2026-11-05-Cuentas-de-prueba.md`

## Pasos
1. Cambiar los tres textos.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Con `VITE_USE_MOCK=true`: el panel y la recuperación muestran el texto nuevo.

## Riesgos / notas
El texto del panel describe lo que hace hoy el back (B-01). El equipo todavía tiene que confirmar esa regla; si cambia, hay que cambiar el texto.
