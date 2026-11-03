# Spec: Panel de administración (backend)

## Fecha
2026-11-03

## Problema
El front tiene el panel de administración en `/admin`, con tres secciones: resumen, parámetros y usuarios. Hoy funciona solo en modo mock porque el back no tiene:

- ningún endpoint de administración;
- un chequeo de rol: los usuarios tienen `roles`, pero ninguna ruta lo mira;
- parámetros configurables, como el interés o la comisión de los cambios.

Este documento es el contrato que el front ya usa en el mock. Si back necesita cambiar algo, lo acordamos y ajustamos los dos lados.

## Solución propuesta

### Acceso
- **Middleware `requireAdmin`.** Va después de `requireAuth` en todas las rutas `/admin/*`. Si `roles` no incluye `admin`, responde `403` con `{ "code": "FORBIDDEN" }`. Esta es la seguridad real: el front oculta el panel solo por comodidad.
- **El primer admin se crea a mano**, con un script o con SQL: `UPDATE users SET roles = '{user,admin}' WHERE email = '...'`. En esta versión no hay endpoint para dar roles.
- **CORS:** agregar `PATCH` a `methods` en `src/config/cors.ts`. Hoy solo permite `GET` y `POST`. También lo necesita `PATCH /users/me`.

### Formato común
- **Montos:** strings con 2 decimales, como en el resto de la API (`"1250.50"`).
- **Porcentajes:** strings con 2 decimales (`"1.50"` es 1,5%).
- **Listas:** `{ items, page, total }`, igual que `/wallet/transactions`.
- **Errores:** `{ "code": "...", "message": "..." }`.

### Endpoints

#### `GET /admin/metrics?period=day|month`
Resumen del día o del mes en curso. Por defecto `day`.

```json
{
  "period": "day",
  "users": { "total": 120, "active": 115, "blocked": 5, "new_in_period": 3 },
  "volume": [
    { "currency": "ARS", "deposits": "150000.00", "exchanges": "20000.00", "transfers": "8000.00" },
    { "currency": "USD", "deposits": "300.00", "exchanges": "0.00", "transfers": "50.00" }
  ]
}
```

- **`volume`:** una fila por cada moneda soportada, aunque esté en cero.
- **`exchanges`:** se cuenta en la moneda de origen.
- **`transfers`:** se cuenta una sola vez, del lado de quien envía.

#### `GET /admin/settings`
```json
{
  "exchange_spread_percent": "1.50",
  "interest_rates": [
    { "currency": "ARS", "annual_percent": "0.00" },
    { "currency": "COP", "annual_percent": "0.00" },
    { "currency": "USD", "annual_percent": "4.00" },
    { "currency": "EUR", "annual_percent": "3.00" }
  ],
  "updated_at": "2026-11-03T15:20:00.000Z",
  "updated_by": { "nombre": "Admin", "email": "admin@latinzumi.test" }
}
```

`updated_at` y `updated_by` valen `null` mientras nadie haya cambiado nada.

#### `PATCH /admin/settings`
- **Body:** los mismos campos editables, todos opcionales:
  ```json
  { "exchange_spread_percent": "2.00", "interest_rates": [{ "currency": "USD", "annual_percent": "4.50" }] }
  ```
- **Respuesta:** `200` con los parámetros completos, igual que el `GET`.
- **Validaciones:**
  - `exchange_spread_percent`: de `0` a `10`, con hasta 2 decimales.
  - `annual_percent`: de `0` a `50`, con hasta 2 decimales, y solo para monedas soportadas.
  - Si algo no cumple: `400` con `{ "code": "INVALID_SETTINGS" }`.
- **Historial:** cada campo que cambia guarda una fila en el historial, con el valor anterior, el nuevo, quién lo cambió y cuándo.

#### `GET /admin/settings/history?page=1&limit=20`
Del cambio más nuevo al más viejo.

```json
{
  "items": [
    {
      "id": "uuid",
      "field": "interest_rates.USD",
      "old_value": "4.00",
      "new_value": "4.50",
      "changed_at": "2026-11-03T15:20:00.000Z",
      "changed_by": { "nombre": "Admin", "email": "admin@latinzumi.test" }
    }
  ],
  "page": 1,
  "total": 1
}
```

`field` vale `exchange_spread_percent` o `interest_rates.<MONEDA>`.

#### `GET /admin/users?search=&estado=&page=1&limit=20`
- **`search`:** busca en el nombre o el email, sin distinguir mayúsculas.
- **`estado`:** `activo` o `bloqueado`. Si no viene, se listan todos.
- **Orden:** los más nuevos primero.

```json
{
  "items": [
    {
      "id": "uuid",
      "nombre": "Valentina",
      "email": "valentina@latinzumi.test",
      "pais": "Argentina",
      "roles": ["user"],
      "estado": "activo",
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "page": 1,
  "total": 1
}
```

#### `GET /admin/users/:id`
```json
{
  "user": { "id": "uuid", "nombre": "...", "email": "...", "pais": "...", "roles": ["user"], "estado": "activo", "created_at": "..." },
  "balances": [ /* mismo formato que GET /accounts */ ],
  "recent_transactions": [ /* últimos 10, mismo formato que GET /wallet/transactions */ ]
}
```

Si el usuario no existe: `404` con `{ "code": "USER_NOT_FOUND" }`.

#### `PATCH /admin/users/:id`
- **Body:** `{ "estado": "activo" | "bloqueado" }`.
- **Respuesta:** `200` con `{ "user": { ... } }`, en el mismo formato que el listado.
- **No se puede bloquear a uno mismo:** responde `422` con `{ "code": "CANNOT_BLOCK_SELF" }`.
- **Al bloquear:**
  - se revocan las sesiones del usuario;
  - `POST /auth/login` y `POST /auth/google` responden `403` con `{ "code": "USER_BLOCKED" }` (el código que ya usa el back);
  - las operaciones que ya terminaron no se tocan.

### Aplicar los parámetros

**Comisión de los cambios (spread).** Se aplica al crear la cotización en `GET /wallet/exchange/quote`:
- `rate` = tasa de mercado × (1 − spread / 100), y `to_amount` se calcula con esa tasa.
- Sumar `spread_percent` a la respuesta, para que el front lo pueda mostrar.
- La diferencia se acredita en una cuenta interna de ingresos, así el ledger sigue balanceado.

**Interés anual.**
- **Cálculo diario:** saldo al cierre del día × (tasa anual / 100) / 365, redondeado a 2 decimales con `HALF_UP`. Si el resultado es `0.00`, no se registra nada.
- **Registro:** cada acreditación es una transacción de tipo `interest`, de una cuenta interna de egresos a la cuenta del usuario.
- **Sin duplicados:** la Idempotency-Key es `interest:<account_id>:<YYYY-MM-DD>`, así correrlo dos veces el mismo día no paga dos veces.
- **Cuándo corre:** en Render gratis el servicio se duerme, así que un `setInterval` no alcanza. Propuesta: un endpoint `POST /internal/accrue-interest`, protegido con un secreto en un header, que se llama una vez por día desde un cron externo (por ejemplo, un workflow programado de GitHub Actions). El endpoint acredita los días que falten desde la última corrida.
- Un cambio de tasa vale desde el día siguiente.

### Base de datos
- **`settings`:** `exchange_spread_percent`, `updated_at`, `updated_by`.
- **`interest_rates`:** `currency`, `annual_percent`.
- **`settings_history`:** `id`, `field`, `old_value`, `new_value`, `changed_at`, `changed_by`.
- **`users.estado`:** admite `bloqueado`.
- **`transactions.type`:** admite `interest`.
- **`interest_runs`:** fecha de la última corrida, para recuperar los días que falten.

## Archivos afectados (orientativo)
- `src/middleware/requireAdmin.ts` (nuevo)
- `src/routes/admin.route.ts`, `src/controllers/admin.controller.ts` (nuevos)
- `src/services/admin-*.service.ts` (nuevos): métricas, parámetros, usuarios.
- `src/services/exchange-quotes.service.ts`: aplicar el spread.
- `src/services/interest.service.ts` (nuevo) y `POST /internal/accrue-interest`.
- `src/services/auth.service.ts`: rechazar a los usuarios bloqueados.
- `src/config/cors.ts`: `PATCH`.
- `db/migrations/012_admin.sql` (nuevo)
- `src/config/swagger.ts`: documentar los endpoints.

## Pasos
1. Migración, `requireAdmin` y `PATCH` en CORS.
2. `GET /admin/users`, `GET /admin/users/:id` y `PATCH /admin/users/:id`, con el bloqueo en el login.
3. `GET` y `PATCH /admin/settings`, y el historial.
4. `GET /admin/metrics`.
5. Aplicar el spread en las cotizaciones.
6. Acreditar los intereses y programar el cron.

Los pasos 1 a 4 alcanzan para prender el panel en el front. El 5 y el 6 hacen que los parámetros tengan efecto.

## Cómo probar
- [ ] Un usuario sin rol `admin` recibe `403` en cualquier `/admin/*`.
- [ ] El admin cambia el spread y la cotización siguiente usa la tasa nueva.
- [ ] Cada cambio de parámetros aparece en el historial con quién lo hizo.
- [ ] El admin no puede bloquearse a sí mismo.
- [ ] Un usuario bloqueado no puede iniciar sesión y su token deja de servir.
- [ ] Correr el interés dos veces el mismo día no acredita dos veces.
- [ ] Las métricas cuentan cada transferencia una sola vez.

## Riesgos / notas
- **Interés sobre saldos:** con plata real implica temas regulatorios. Para la demo alcanza, pero conviene dejar claro en la app que es de prueba.
- **Un spread mal cargado afecta todas las cotizaciones.** Por eso el límite de 10% y el historial.
- **Pendiente de la nota del 30/10:** la `Idempotency-Key` sigue siendo única para todos los usuarios. Conviene resolverlo antes de sumar las claves del interés.
