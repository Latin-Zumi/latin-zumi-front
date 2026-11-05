# Spec: Cuentas de prueba de producción

## Fecha
2026-11-05

## Problema
Hace falta documentar las cuentas de prueba disponibles en producción, qué casos permiten probar y cómo recrearlas desde la aplicación, sin guardar credenciales ni datos sensibles.

## Solución propuesta
Mantener un inventario con el email, el rol, las monedas con saldo y el propósito de cada cuenta, y describir el flujo de registro y depósito necesario para recrearlas.

## Cuentas de prueba

| Cuenta | Email | Rol | Monedas con saldo | Para qué prueba sirve |
|---|---|---|---|---|
| Sofía (Colombia) | sofi.latinzumi@proton.me | Usuario sin rol admin | Una sola moneda: COP | Comprobar la experiencia de un usuario estándar y de una billetera con saldo en una única moneda; verificar que no accede a funciones de administración.|
| Marcela | marce.latinzumi@proton.me | Usuario sin rol admin | ARS, USD, EUR, COP | Comprobar el saldo unificado con varias monedas, el cambio de moneda con comisión y las transferencias con la cuenta de Sofía (enviar y recibir). |

## Cómo recrearlas desde la app
1. Registrarse en `/register` con nombre, email, país y contraseña. El registro no permite elegir moneda ni rol: la cuenta nace sin rol admin.
2. Iniciar sesión y hacer un depósito desde la billetera en una sola moneda (por ejemplo, COP). Esa moneda es la única que va a tener saldo.
3. Para conservar el caso de una sola moneda, no depositar ni operar en otras monedas.
4. Confirmar que el saldo aparece en la billetera.
5. Completar la tabla con el email y la moneda que efectivamente quedaron configurados.

## Archivos afectados
- `docs/specs/2026-11-05-Cuentas-de-prueba.md`

## Pasos
1. Completar el email y la moneda con saldo de cada cuenta.
2. Recrear las cuentas mediante el registro y el depósito, si hace falta.
3. Confirmar el rol y los saldos visibles en cada billetera.

## Cómo probar
- [ ] La cuenta inicia sesión como usuario sin rol admin y no accede a `/admin`.
- [ ] La cuenta muestra saldo en una sola moneda.
- [ ] El email y la configuración documentados corresponden a la cuenta de producción.
- [ ] Una transferencia de Marcela a Sofía aparece como enviada en el historial de Marcela y como recibida en el de Sofía, y ambas reciben su email de confirmación.

## Riesgos / notas
- Los emails y las monedas corresponden a las cuentas creadas en producción. Si cambian los saldos o se recrean las cuentas, actualizar la tabla.
- Usar casillas del equipo y no mails personales: cada transacción envía un email de confirmación al usuario.
- Sofía (una sola moneda) tiene que recibir transferencias solo en esa moneda, para no perder ese caso de prueba.
- Para probar el bloqueo de usuarios conviene una cuenta descartable aparte, no las de esta tabla.
- No incluir contraseñas, secretos, tokens ni valores de variables de entorno en este documento. Las credenciales se guardan en el gestor de contraseñas del equipo.