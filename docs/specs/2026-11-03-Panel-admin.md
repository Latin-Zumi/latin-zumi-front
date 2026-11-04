# Spec: Panel de administración

## Fecha
2026-11-03

## Problema
El navbar ya muestra "Panel admin" a los usuarios con rol `admin`, y `Layout` deja afuera las rutas `/admin`, pensando en un layout propio para el panel. Pero la ruta `/admin` no existe: el link manda al inicio.

El equipo quiere un panel para:
- ajustar los parámetros de la plata: el interés por moneda y la comisión de los cambios;
- administrar usuarios;
- ver métricas básicas.

## Solución propuesta
Un panel con tres secciones. Usa el contrato de `2026-11-03-Panel-admin-backend.md`, que comparte con back.

- **`/admin`: Resumen.** Usuarios (total, activos, bloqueados, nuevos) y volumen por moneda de depósitos, cambios y transferencias, del día o del mes.
- **`/admin/parametros`: Parámetros.**
  - Formulario con la comisión de los cambios y el interés anual de cada moneda.
  - Los porcentajes aceptan coma o punto, con hasta 2 decimales: la comisión de 0 a 10 y el interés de 0 a 50.
  - Debajo, el historial de cambios.
- **`/admin/usuarios`: Usuarios.**
  - Búsqueda por nombre o email y filtro por estado, con paginado.
  - **`/admin/usuarios/:id`:** datos, saldos y últimos movimientos del usuario. Tiene un botón para bloquear o activar la cuenta, que pide confirmación. No se puede bloquear a uno mismo.

El panel tiene un layout propio (`AdminLayout`): la marca, las pestañas de las secciones, un link a la billetera y el cambio de tema.

**`AdminRoute`** protege `/admin/*`:
- sin sesión, manda a `/login`;
- sin rol `admin`, manda a `/dashboard`.

Es solo comodidad: el back tiene que rechazar con `403` cualquier pedido que no venga de un admin.

**Flag `ADMIN_ENABLED`:** igual a `VITE_USE_MOCK` hasta que back tenga los endpoints. Con la API real no se muestran ni el link ni la ruta.

**Mock:**
- usuario `admin@latinzumi.test`, con la misma contraseña de prueba que los demás;
- parámetros e historial guardados en `localStorage`;
- métricas calculadas con las billeteras mock;
- bloquear o activar cambia el estado del usuario mock.

## Archivos afectados
- `src/config/features.ts`: `ADMIN_ENABLED`.
- `src/types/admin.ts` (nuevo)
- `src/services/adminService.ts` (nuevo)
- `src/mocks/admin.ts` (nuevo) y `src/mocks/users.ts`: usuario admin, listado y cambio de estado.
- `src/utils/admin.ts` (nuevo): validación de porcentajes.
- `src/components/AdminRoute.tsx` (nuevo)
- `src/components/admin/AdminLayout.tsx` (nuevo)
- `src/pages/admin/AdminOverview.tsx`, `AdminSettings.tsx`, `AdminUsers.tsx`, `AdminUserDetail.tsx` (nuevos)
- `src/styles/pages/admin.css` (nuevo) y `src/styles/index.css`
- `src/App.tsx`: rutas.
- `src/components/common/Navbar.tsx`: link solo con `ADMIN_ENABLED`.
- `tests/services/adminService.test.ts`, `tests/utils/admin.test.ts` y `tests/components/AdminRoute.test.tsx` (nuevos)

## Pasos
1. Tipos, servicio y mock.
2. `AdminRoute`, `AdminLayout` y rutas.
3. Las cuatro pantallas.
4. Tests.

## Cómo probar
- [x] Con `VITE_USE_MOCK=true`, entrar con `admin@latinzumi.test` → aparece "Panel admin" y se ven las tres secciones.
- [x] Con un usuario sin rol admin, ir a `/admin` → redirige a `/dashboard`.
- [x] Sin sesión, ir a `/admin` → redirige a `/login`.
- [x] Guardar una comisión de `1,5` → queda `1,50 %` y aparece en el historial.
- [x] Una comisión de `12` o `1,555` → muestra el error y no guarda.
- [x] Bloquear a un usuario → cambia su estado en el listado. Sobre uno mismo, el botón no aparece.
- [ ] Con la API real, el link y la ruta no aparecen.

## Riesgos / notas
- **Los parámetros del panel no se conectan al mock.** Las cotizaciones mock usan un spread de ejemplo fijo de 1,50 % para mostrar la comisión; el porcentaje configurable del panel solo se aplica en el backend. El mock tampoco acredita intereses.
- **Tipo de movimiento `interest`:** cuando el back acredite intereses, aparecerá en el historial y hay que sumarle la etiqueta.
- **En el mock, un usuario bloqueado todavía puede entrar.** El rechazo del login lo hace el back.
- **CORS:** guardar parámetros y bloquear usuarios usan `PATCH`, que hoy el CORS del back no permite.
