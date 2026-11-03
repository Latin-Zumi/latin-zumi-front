# Spec: Recuperación y cambio de contraseña, y errores del back

## Fecha
2026-11-03

## Problema
El Report04 del back (revisión de endpoints entre los dos repos) marca dos brechas del front:

**Contraseña.** El back ya tiene `POST /auth/forgot-password`, `POST /auth/reset-password` y `POST /auth/change-password`, pero el front no los usa:
- "Recuperar contraseña" termina en un aviso de "todavía no disponible".
- No existe la pantalla a la que lleva el link del email: el back arma `PASSWORD_RESET_URL`, por defecto `http://localhost:5173/restablecer-contrasena?token=...`.
- El login descarta `password_change_required`. Un usuario con una contraseña vieja, de menos de 8 caracteres, recibe `403` en todas las rutas y no tiene cómo cambiarla.

**Errores.** Algunos códigos del back caen en el mensaje genérico:
- `QUOTE_NOT_FOUND` (404)
- `WALLET_NOT_FOUND` (404)
- `ACCOUNT_NOT_FOUND` (404/500)
- `ACCOUNT_BLOCKED` (403 en el login y en Google)
- `INVALID_IDEMPOTENCY_KEY` (400)

## Solución propuesta

### Contraseña
- **`authService`**, con su versión mock:
  - `forgotPassword(email)` → `POST /auth/forgot-password`. El back responde `202` exista o no el email; el front muestra siempre el mismo mensaje.
  - `resetPassword(token, password)` → `POST /auth/reset-password`, que responde `204`. `INVALID_RESET_TOKEN` muestra "El enlace venció o ya fue usado" y ofrece pedir uno nuevo.
  - `changePassword(current, new)` → `POST /auth/change-password` con el token, que responde `204`. Errores:
    - `INVALID_CURRENT_PASSWORD` (401): la contraseña actual es incorrecta. No cierra la sesión.
    - `PASSWORD_UNCHANGED` (400): la nueva es igual a la actual.
    - `PASSWORD_NOT_SET` (409): cuenta de Google sin contraseña.
    - Un `401` sin código: la sesión venció.
- **`Session`** guarda `password_change_required`, que viene en la respuesta del login.
- **`ProtectedRoute`**: con ese flag en `true`, manda a `/cambiar-contrasena` en lugar de mostrar la billetera. Al cambiar la contraseña, el flag pasa a `false` y se sigue navegando; el back mantiene la sesión actual y revoca las otras.
- **Pantallas:**
  - `/recuperar-contrasena`: ahora envía el pedido.
  - `/restablecer-contrasena` (nueva): lee `token` de la URL y pide la contraseña nueva dos veces. Sin token, ofrece pedir un enlace.
  - `/cambiar-contrasena` (nueva, requiere sesión): pide la contraseña actual, la nueva y la confirmación. También se llega desde el navbar.
- **Contraseña nueva:** las mismas reglas que el registro, de 8 a 24 caracteres, con una mayúscula y un carácter especial. La lista de requisitos pasa a un componente compartido, `PasswordChecklist`.

### Errores
- **`transactionService`:** suma `QUOTE_NOT_FOUND`, `WALLET_NOT_FOUND`, `ACCOUNT_NOT_FOUND` e `INVALID_IDEMPOTENCY_KEY`. En el modal de cambio, `QUOTE_NOT_FOUND` se trata igual que una cotización vencida: hay que pedir otra.
- **Login y Google:** un `403` muestra "Tu cuenta está bloqueada". Se decide por el status, no por el código.
- **`userService`** (`PATCH /users/me`): `WALLET_NOT_FOUND` y `ACCOUNT_NOT_FOUND` con su mensaje.

## Archivos afectados
- `src/services/authService.ts`, `src/mocks/users.ts`
- `src/services/transactionService.ts`, `src/types/index.ts`, `src/components/wallet/ExchangeModal.tsx`
- `src/services/userService.ts`
- `src/context/auth/*`: `passwordChangeRequired` y `completePasswordChange`.
- `src/components/ProtectedRoute.tsx`
- `src/components/forms/PasswordChecklist.tsx` (nuevo) y `src/components/forms/RegisterForm.tsx`
- `src/pages/PasswordRecovery.tsx`, `src/pages/PasswordReset.tsx` (nuevo), `src/pages/ChangePassword.tsx` (nuevo)
- `src/App.tsx`, `src/components/common/Navbar.tsx`
- Tests de `authService`, `transactionService`, `ProtectedRoute` y de las pantallas nuevas.

## Pasos
1. Errores nuevos en los servicios.
2. Servicios de contraseña y el flag en la sesión.
3. Pantallas y rutas.
4. Tests.

## Cómo probar
Probado con el mock y con tests. Falta probarlo contra el back real.

- [x] "Recuperar contraseña" muestra siempre el mismo mensaje, exista o no el email.
- [ ] `/restablecer-contrasena?token=...` cambia la contraseña. Con un token vencido, ofrece pedir uno nuevo.
- [x] Un login con `password_change_required: true` lleva a `/cambiar-contrasena`. Después de cambiarla, se entra a la billetera.
- [x] Una contraseña actual incorrecta muestra el error sin cerrar la sesión.
- [x] Un usuario bloqueado ve "Tu cuenta está bloqueada" al iniciar sesión.
- [x] Pedir una cotización que el back ya no tiene pide otra.

## Riesgos / notas
- **Largo de la contraseña:** el back ahora acepta de 8 a 128 caracteres; el front sigue en 8 a 24 por decisión del equipo. El login acepta hasta 128, para no dejar afuera cuentas con contraseñas largas.
- **`PASSWORD_RESET_URL` en Render** tiene que apuntar al front de Vercel: `https://latin-zumi-front-1x4s.vercel.app/restablecer-contrasena`. Si no, el link del email lleva a `localhost`.
- **CORS:** `main` del back ya permite `PATCH`, pero falta desplegarlo: Render todavía responde `GET, POST`. Sin eso no funcionan completar el perfil ni el panel de admin.
- **El `403` por contraseña vieja no trae `code`.** El front lo reconoce por el flag del login. Si back le agrega un código, por ejemplo `PASSWORD_CHANGE_REQUIRED`, los otros servicios también podrían reconocerlo.
