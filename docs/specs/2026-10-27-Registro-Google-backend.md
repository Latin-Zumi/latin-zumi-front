# Spec: Registro con Google conectado al backend y perfil completo

## Fecha
2026-10-27

## Problema
Hoy el ingreso con Google queda solo en Firebase (`loginWithGoogle` en `authService.ts`):

- El backend no se entera: no se crea el usuario en la base ni su billetera.
- La sesión usa el token de Firebase, que el backend no reconoce: `/wallet/balances` responde 401.
- Faltan datos que el registro normal sí pide: `pais`, y por lo tanto `moneda_preferida`, además de `id`, `roles` y `estado`. `nombre` y `email` pueden venir vacíos.
- Si alguien se registró con email y contraseña y después entra con Google, quedan dos cuentas distintas para el mismo email.

## Solución propuesta
Firebase se usa solo para identificar al usuario con Google. El backend verifica esa identidad y devuelve su propia sesión, igual que el login normal. Así el resto de la app no distingue cómo entró el usuario.

Flujo:
1. El usuario toca "Continuar con Google" y elige su cuenta en el popup.
2. El frontend obtiene el `idToken` de Firebase y lo manda a `POST /auth/google`.
3. El backend verifica el token, busca al usuario por email y:
   - si existe, lo vincula con Google;
   - si no existe, lo crea con su billetera.
4. El backend devuelve `{ token, user }` con su propio token.
5. Si `user.pais` es `null`, el frontend redirige a `/completar-perfil` para pedir el país y, si falta, el nombre.

### Contrato de la API

**`POST /auth/google`**
- Body: `{ "idToken": "<token de Firebase>" }`
- `200`: `{ "token": "<token del backend>", "user": BackendAuthUser }`. Si el usuario es nuevo, `user.pais` es `null`.
- `401`: token inválido o vencido.
- `409`: el email ya existe y Google no lo tiene verificado (`email_verified: false`).

**`PATCH /users/me`** (con `Authorization: Bearer <token del backend>`)
- Body: `{ "nombre"?: string, "pais": "Argentina" | "Colombia" | "Otro" }`
- `200`: `{ "user": BackendAuthUser }`, con `moneda_preferida` calculada a partir del país, igual que en el registro.
- `400`: datos inválidos.

## Archivos afectados

### Backend (lo hace quien lleva la API)
- Verificar el `idToken` con `firebase-admin` (`verifyIdToken`).
- Tabla de usuarios:
  - `google_uid` nueva, única y opcional.
  - `password_hash` pasa a ser opcional (los usuarios de Google no tienen contraseña).
  - `pais` pasa a ser opcional hasta que el usuario completa el perfil.
  - `foto_url` nueva y opcional.
- Crear la billetera del usuario cuando se crea con Google.
- Endpoints `POST /auth/google` y `PATCH /users/me`.

### Frontend
- `src/services/authService.ts`:
  - `loginWithGoogle` llama a `POST /auth/google`, guarda la sesión del backend con `saveSession` y después cierra la sesión de Firebase.
  - Se eliminan `GoogleAuthUser` y la sesión de tipo `firebase`.
  - `BackendAuthUser.pais` pasa a ser `string | null` y se agrega `foto_url?: string | null`.
- `src/services/userService.ts` (nuevo): `updateProfile()` para `PATCH /users/me`.
- `src/mocks/users.ts` (nuevo): simula `/auth/google` y `/users/me` con `VITE_USE_MOCK=true`.
- `src/components/forms/schemas.ts` (nuevo): validaciones de nombre y país compartidas entre Register y completar perfil.
- `src/components/forms/GoogleSignInButton.tsx` (nuevo): botón de Google compartido entre Login y Register, con sus errores y el aviso.
- `src/context/AuthProvider.tsx`: se quita `onIdTokenChanged`; la sesión se restaura desde `localStorage` como en el login normal. Se agrega `updateUser(user)` al contexto.
- `src/pages/CompleteProfile.tsx` (nuevo) y `src/components/forms/CompleteProfileForm.tsx` (nuevo): país obligatorio, nombre solo si falta.
- `src/components/ProtectedRoute.tsx`: si hay sesión y `user.pais === null`, redirige a `/completar-perfil`.
- `src/App.tsx`: ruta `/completar-perfil`, protegida.
- `src/components/forms/RegisterForm.tsx`: botón "Registrarse con Google" que usa el mismo flujo.
- `src/components/common/Navbar.tsx`: quitar el texto alternativo `'Cuenta de Google'` y el chequeo `'roles' in user`.

## Pasos
1. Acordar con backend el contrato de `POST /auth/google` y `PATCH /users/me`.
2. Backend: migración de la tabla de usuarios, verificación con `firebase-admin` y los dos endpoints.
3. Frontend: adaptar `authService` y `AuthProvider` para usar la sesión del backend.
4. Frontend: crear `userService`, la página y el formulario de completar perfil, y la redirección en `ProtectedRoute`.
5. Frontend: agregar el botón de Google en Register y limpiar `Navbar`.
6. Agregar el modo mock (`VITE_USE_MOCK`) para `/auth/google` y `/users/me`, así se puede probar sin backend.

## Cómo probar
- [ ] Usuario nuevo con Google → se crea en la base con billetera y redirige a `/completar-perfil`.
- [x] Completar el perfil → guarda nombre, país y moneda, y lleva al Dashboard (probado en modo mock; los balances dependen del backend).
- [ ] Usuario con perfil completo que vuelve a entrar con Google → va directo al Dashboard.
- [ ] Email ya registrado con contraseña que entra con Google → usa la misma cuenta, sin duplicarla.
- [x] Sin perfil completo, entrar a `/dashboard` → redirige a `/completar-perfil` (probado en modo mock).
- [x] Recargar la página con sesión de Google → la sesión se mantiene (probado en modo mock).
- [x] Una sesión vieja de Firebase guardada en el navegador se descarta y pide ingresar de nuevo.
- [ ] Si el backend responde 404 o 501 en `/auth/google` → el botón sigue visible y aparece el aviso "El ingreso con Google todavía no está disponible".
- [ ] Cerrar el popup de Google → no muestra error.
- [x] `npm run build` y `npm run lint` pasan.

## Riesgos / notas
- Vincular cuentas por email solo es seguro si Google marca el email como verificado (`email_verified`). Si no, el backend debe responder 409.
- El token de Firebase vence en 1 hora, pero solo se usa una vez para el intercambio; después vale la sesión del backend.
- El backend necesita las credenciales de servicio de Firebase (archivo JSON o variables de entorno). No se suben al repo.
- Mientras el backend no tenga `/auth/google`, el botón de Google sigue visible y, al usarlo, muestra un aviso para ingresar con email y contraseña. No se crea ninguna sesión.
