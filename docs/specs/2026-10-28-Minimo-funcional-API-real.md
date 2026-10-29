# Spec: Mínimo funcional contra la API real

## Fecha
2026-10-28

## Problema
El backend ya tiene listo el mínimo funcional (registro, login, cuentas y logout), pero con `VITE_USE_MOCK=false` el front no funciona contra él:

- **Login:** manda `{ email, password }` y el backend exige `{ identifier, password }`, así que responde `400`.
- **Saldos:** se piden a `GET /wallet/balances`, que no existe (`404`). El endpoint real es `GET /accounts`.
- **Tipos:** `AuthUser.id` y `Balance.wallet_id` son `number`, y el backend devuelve UUID string.
- **Logout:** solo borra `localStorage`; no revoca el token en el backend.
- **Contraseña:** el registro pide mínimo 8 caracteres y el backend exige de 15 a 128.
- **Errores:** no se manejan `400` ni `429`.
- **Endpoints que no existen:**
  - El botón de Google y `/completar-perfil` llaman a `POST /auth/google` y `PATCH /users/me`.
  - El Dashboard llama a `/wallet/transactions`, `/wallet/transfers`, etc.

  Todos responden `404`.

Referencia: documentos del backend `2026-10-28-1230-Minimo-Funcional-Frontend.md` y `2026-10-28-1146-Minimo-Funcional-Revision-Backend.md`.

## Solución propuesta
Alinear el front al contrato real sin perder el modo mock:

- **Login:** envía `identifier`.
- **Validación de sesión:** `requestSession` valida el envelope `{ token, user }` antes de guardarlo.
- **Errores por status:** los mensajes salen del status HTTP, no del `message`.
  - `400` → "Revisá los datos ingresados."
  - `401` → "Email o contraseña incorrectos."
  - `409` → "Ya existe una cuenta con ese email."
  - `429` → "Demasiados intentos. Esperá unos minutos."
  - Red o `5xx` → "No pudimos conectar con el servidor."
- **Logout:** llama a `POST /auth/logout` y borra la sesión local siempre, aunque falle la red.
- **Saldos:** `getBalances()` usa `GET /accounts` y mapea `{ data: Account[] }` a `Balance` (`account_id`, `wallet_id`, `currency`, `amount`). Muestra los saldos en `"0"`.
  - `401` → se cierra la sesión y `ProtectedRoute` lleva a `/login`.
  - `403` → se muestra el mensaje sin borrar la sesión.
- **Flags en `src/config/features.ts`:**
  - `GOOGLE_AUTH_ENABLED = false`: oculta el botón de Google, la ruta `/completar-perfil` y la redirección a esa ruta. Los componentes se conservan.
  - `TRANSACTIONS_ENABLED`, igual a `VITE_USE_MOCK`: sin mock no se piden movimientos ni se muestran Depositar, Cambiar y Transferir, porque el backend todavía no tiene esos endpoints. En modo mock siguen funcionando.
- **Contraseña del registro:** de 8 a 24 caracteres, por decisión del equipo de front (el backend hoy exige de 15 a 128; ver notas). Se mantienen la mayúscula, el carácter especial y el rechazo de contraseñas que son solo espacios. En el login solo se exige que no esté vacía y un máximo de 128, para no bloquear cuentas creadas con el límite del backend.
- **Mocks:** ids string, para que `VITE_USE_MOCK=true` compile y funcione con los tipos nuevos.
- **`.env.example`:** `VITE_USE_MOCK=false`.

## Archivos afectados
- `src/config/features.ts` (nuevo)
- `src/types/index.ts`: `Balance` con `account_id` y `wallet_id` string.
- `src/services/authService.ts`: `AuthUser.id` string, `identifier`, validación del envelope, errores por status, `clearSession()` y `logout()` asíncrono.
- `src/services/walletService.ts`: `GET /accounts` y `WalletSessionExpiredError`.
- `src/context/auth/AuthProvider.tsx`: `logout` espera al servicio y es estable con `useCallback`.
- `src/context/wallet/WalletProvider.tsx`: no pide movimientos sin `TRANSACTIONS_ENABLED`; ante `401` cierra la sesión.
- `src/pages/Dashboard.tsx`: estado vacío de saldos; oculta las operaciones sin `TRANSACTIONS_ENABLED`.
- `src/App.tsx` y `src/components/ProtectedRoute.tsx`: `/completar-perfil` solo con Google habilitado.
- `src/components/forms/LoginForm.tsx` y `RegisterForm.tsx`: botón de Google condicionado.
- `src/utils/registration.ts` y `src/components/forms/schemas.ts`: contraseña de 8 a 24 caracteres en el registro; máximo de 128 en el login.
- `src/mocks/users.ts` y `src/mocks/wallets.ts`: ids string.
- `.env.example`

## Pasos
1. Flags, tipos y mocks.
2. `authService` y `AuthProvider`.
3. `walletService` y `WalletProvider`.
4. Ocultar Google, perfil y operaciones.
5. Reglas de contraseña y `.env.example`.

## Cómo probar
- [x] `npm run build` y `npx eslint .` pasan.
- [x] Con `VITE_USE_MOCK=false`, ninguna pantalla llama a `/wallet/*`, `/auth/google`, `/users/me` ni `/users/lookup`.
- [x] Login envía `{ identifier, password }`.
- [x] Registro con contraseña de menos de 8 o más de 24 caracteres se rechaza antes de llamar al backend.
- [x] `401`, `409`, `429` y error de red muestran su mensaje sin romper la pantalla.
- [x] El Dashboard muestra los saldos de `GET /accounts`, incluido `"0"`.
- [x] `401` en `/accounts` cierra la sesión y lleva a `/login`; `403` muestra el mensaje sin cerrarla.
- [x] Logout llama a `POST /auth/logout` y borra la sesión aunque falle la red.
- [x] Con `VITE_USE_MOCK=true`, login, Dashboard, depósito, cambio y transferencia siguen funcionando.
- [ ] Flujo completo contra el backend real (registro → Dashboard → recarga → logout → login), cuando esté levantado con `CORS_ORIGINS`.

## Riesgos / notas
- **Contraseña 8–24 vs. backend 15–128 (pendiente con backend):** el front acepta de 8 a 24 caracteres, pero `POST /auth/register` hoy rechaza menos de 15 con `400` ("Revisá los datos ingresados."). Hasta que el backend baje su mínimo a 8, las contraseñas de 8 a 14 caracteres no van a poder registrarse. Hay que pedírselo al responsable del backend.
- **El backend tiene que estar desplegado** con sus cambios commiteados y `CORS_ORIGINS` configurado (local `http://localhost:5173` y el dominio de Vercel). Sin eso, el navegador bloquea las llamadas.
- **Vercel:** después de cambiar `VITE_USE_MOCK=false` y `VITE_API_URL`, hay que redeployar.
- **Sesión:** el token dura 1 hora y no hay refresh. Al vencer, el próximo `401` lleva a `/login`.
- **Cuentas:** hoy cada usuario tiene una sola cuenta, en la moneda de su país. El total y el gráfico se calculan sobre esa cuenta.
- **Mayúscula y carácter especial:** el backend no los exige, pero el equipo de front los había pedido. Si se decide quitarlos, se cambia solo `getPasswordRequirements`.
- **`429`:** hoy responde `{ error }` en lugar de `{ code, message }`. El front decide por el status, así que no se rompe cuando lo unifiquen.
