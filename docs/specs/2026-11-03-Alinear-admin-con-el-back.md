# Spec: Alinear el panel de admin con el back

## Fecha
2026-11-03

## Problema
En la revisión del 2026-11-03, el back había mergeado las rutas de `/admin/*` en `main`, con diferencias respecto del contrato de `2026-11-03-Panel-admin-backend.md`. Este apartado documenta los ajustes aplicados entonces:

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

`ADMIN_ENABLED` continúa habilitado solo cuando `VITE_USE_MOCK=true`. Para usar el panel con la API real deben confirmarse el despliegue de las rutas y las migraciones requeridas antes de habilitarlo en el frontend.

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
Revisión del 2026-11-04: Render ya tiene `/admin/*` (responde `401` sin token) y el CORS permite `PATCH`. Para probarlo con la API real falta:

1. Confirmar las migraciones `012_admin.sql` y `013_idempotency_per_user.sql` en Neon.
2. Confirmar un usuario con rol `admin`.
3. Habilitar el panel para la API real: ver `2026-11-04-Prender-panel-admin.md`.

Las métricas de "hoy" cuentan las últimas 24 horas, no el día en curso.

El back acredita los intereses con `POST /internal/accrue-interest`, así que hace falta un cron diario con `INTERNAL_CRON_SECRET`. Antes de cargar tasas mayores a 0 tiene que corregir cómo elige la tasa de cada día: hoy, guardar una tasa antes de que corra el proceso puede dejar ese día sin interés.
