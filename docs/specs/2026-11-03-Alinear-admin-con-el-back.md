# Spec: Alinear el panel de admin con el back

## Fecha
2026-11-03

## Problema
El back mergeó las rutas de `/admin/*` en `main`, con diferencias respecto del contrato de `2026-11-03-Panel-admin-backend.md`. Con el front como estaba, el panel falla al prenderlo:

- Todas las respuestas vienen dentro de `{ "data": ... }`.
- `PATCH /admin/settings` recibe `interest_rates` como mapa (`{ "USD": "4.00" }`), aunque el `GET` lo devuelve como lista.
- `changed_by` del historial puede venir en `null`.
- Los límites de intentos responden `429` con `{ "code": "TOO_MANY_REQUESTS" }`, que en las operaciones y en el panel caía en el mensaje genérico.
- La cuenta bloqueada usa `ACCOUNT_BLOCKED`, no `USER_BLOCKED`. El front decide por el status `403`, así que solo cambia la documentación.

## Solución propuesta
Adaptar el front al back:

- **`adminService`:** saca `data` de cada respuesta y convierte `interest_rates` en mapa antes del `PATCH`. El mock y las pantallas siguen usando la lista.
- **`AdminSettings`:** muestra "—" si `changed_by` viene en `null`.
- **`TOO_MANY_REQUESTS`:** suma su mensaje en `adminService` y `transactionService`.
- **Specs:** `ACCOUNT_BLOCKED` y las diferencias de contrato.

`ADMIN_ENABLED` sigue atado al mock hasta que Render tenga el back nuevo.

## Archivos afectados
- `src/services/adminService.ts`, `src/services/transactionService.ts`, `src/services/authService.ts`
- `src/types/admin.ts`, `src/types/index.ts`
- `src/pages/admin/AdminSettings.tsx`
- `src/config/features.ts`
- `tests/services/adminService.test.ts`, `tests/services/transactionService.test.ts`
- `docs/specs/2026-11-03-Panel-admin-backend.md`, `docs/specs/2026-11-03-Contrasena-y-errores.md`

## Pasos
1. Adaptar los servicios y los tipos.
2. Actualizar los tests y los specs.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Con `VITE_USE_MOCK=true` el panel sigue funcionando igual.
- [ ] Con la API real: las tres secciones cargan, guardar parámetros aparece en el historial y bloquear cambia el estado.

## Riesgos / notas
Para probarlo con la API real falta:

1. Desplegar `main` del back en Render. En la última revisión `/admin/*` daba 404 y el CORS no tenía `PATCH`.
2. Correr las migraciones `012_admin.sql` y `013_idempotency_per_user.sql` en Neon.
3. Crear un usuario con rol `admin`.
4. Cambiar `ADMIN_ENABLED` a `true` en el front.

Las métricas de "hoy" cuentan las últimas 24 horas, no el día en curso. El interés se guarda, pero el back todavía no lo acredita.
