# Spec: Prender el panel de admin con la API real

## Fecha
2026-11-04

## Problema
El panel de admin solo se habilita en modo mock. Con la API real, un usuario con rol `admin` no ve el link "Panel admin" y `/admin` lo redirige, aunque el back ya esté listo.

## Solución propuesta
Dejar `ADMIN_ENABLED` en `true`. El link y las rutas siguen protegidos por el rol `admin`, y el back responde `403` a cualquier otro usuario.

Se comprobó el 2026-11-04 con la cuenta admin en producción: tiene rol `admin`, y `GET /admin/settings` y `GET /admin/metrics` responden `200`.

## Archivos afectados
- `src/config/features.ts`
- `docs/specs/2026-11-03-Panel-admin.md`, `docs/specs/2026-11-03-Alinear-admin-con-el-back.md`

## Pasos
1. Cambiar `ADMIN_ENABLED`.
2. Actualizar los specs.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Un build con `VITE_USE_MOCK=false` incluye el panel.
- [ ] En producción, la cuenta admin ve "Panel admin" y las tres secciones cargan.
- [ ] En producción, un usuario sin rol admin no ve el link y `/admin` lo redirige a `/dashboard`.
- [ ] En producción, guardar una comisión aparece en el historial, y bloquear a un usuario de prueba le cierra la sesión.

## Riesgos / notas
- **No cargar tasas de interés mayores a 0** hasta que el back corrija cómo elige la tasa de cada día. Hoy, guardar una tasa antes de que corra el proceso puede dejar ese día sin interés.
- **Falta el cron de intereses:** sin él, las tasas se guardan, pero no se acreditan.
- **La comisión se aplica enseguida:** las cotizaciones nuevas la usan apenas se guarda.
