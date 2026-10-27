# Spec: Transacciones — contrato de API y servicio con mock

## Fecha
2026-10-27

## Problema
El backend de transacciones todavía no está listo, y hoy el Dashboard funciona solo con datos fijos:

- `pages/Dashboard.tsx` siempre usa `mockWallet` (`mocks/balances.ts`), aunque haya backend y aunque el usuario sea otro. En modo mock muestra a "Valentina" en vez del usuario logueado.
- La transferencia vive en un `useState`: al recargar se pierde, y el destinatario es un nombre libre, no una cuenta.
- Los montos se calculan con decimales flotantes (`Number(...)`, `toFixed`), lo que puede dar errores de redondeo.
- `walletService.getBalances` existe pero nadie lo usa.
- En modo mock, `/dashboard` queda sin `ProtectedRoute`.
- No hay depósito, cambio de moneda ni historial.

Necesitamos avanzar con el frontend sin esperar al backend, y que el cambio al backend real después sea solo de la capa de servicio.

## Solución propuesta
1. **Acordar el contrato de la API** (abajo) con el equipo de backend antes de codear.
2. **`transactionService`** con dos implementaciones detrás de `VITE_USE_MOCK`, igual que `authService`:
   - **Mock:** guarda saldos y movimientos por usuario en `localStorage`, valida saldo y destinatario, y simula demora y errores.
   - **Real:** hace los `fetch` del contrato. Queda escrita aunque todavía no se use.
3. **`WalletContext`:** saldos y movimientos compartidos. Después de una operación se actualizan con lo que devuelve el servicio, sin recargar.
4. **Dashboard con datos del contexto** y del usuario logueado. Se quita `mockWallet` de la página.
5. **Montos en centavos enteros** para sumar, restar y comparar. Se convierten a string solo para mostrar o enviar.

Este spec cubre la base (etapa 1). Las pantallas de depósito, cambio e historial (etapa 2) van en specs aparte.

### Contrato de la API

Todos los endpoints llevan `Authorization: Bearer <token del backend>`.

**Convenciones:**
- **Montos:** strings con hasta 2 decimales (`"1500.50"`), como ya llega `amount` en `/wallet/balances`. Nunca números.
- **Fechas:** ISO 8601 en UTC (`"2026-10-27T14:05:00Z"`).
- **Monedas:** `ARS`, `COP`, `USD` o `EUR`.
- **`Idempotency-Key`:** todo `POST` lleva este header con un UUID generado por el frontend. Si llega dos veces la misma clave (doble clic o reintento), el backend devuelve la misma respuesta sin repetir la operación.
- **Errores:** body `{ "code": string, "message": string }`. El frontend decide el texto a mostrar según `code`.

**Movimiento (`Transaction`)**
```json
{
  "id": "uuid",
  "type": "deposit | transfer_sent | transfer_received | exchange",
  "status": "completed | pending | failed",
  "currency": "ARS",
  "amount": "1500.50",
  "created_at": "2026-10-27T14:05:00Z",
  "description": "Transferencia a Mateo",
  "counterparty": { "nombre": "Mateo", "email": "mateo@mail.com" },
  "exchange": { "to_currency": "USD", "to_amount": "1.20", "rate": "0.0008" }
}
```
`counterparty` va solo en transferencias y `exchange` solo en cambios de moneda.

**Endpoints**

| Método y ruta | Body o query | Respuesta `200` |
|---|---|---|
| `GET /wallet/balances` (ya existe) | — | `Balance[]` |
| `GET /wallet/transactions` | `?type=&currency=&from=&to=&page=1&limit=20` | `{ items: Transaction[], page, total }`, del más nuevo al más viejo |
| `GET /users/lookup` | `?email=` | `{ nombre }`, para confirmar a quién se transfiere |
| `POST /wallet/transfers` | `{ recipient_email, currency, amount, note? }` | `{ transaction, balances }` |
| `POST /wallet/deposits` | `{ currency, amount }` | `{ transaction, balances }` |
| `GET /wallet/exchange/quote` | `?from=&to=&amount=` | `{ quote_id, rate, to_amount, expires_at }` |
| `POST /wallet/exchanges` | `{ quote_id }` | `{ transaction, balances }` |

Todas las operaciones devuelven también los saldos actualizados, así el frontend no tiene que pedirlos aparte.

**Códigos de error**

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `INVALID_AMOUNT` | Monto ≤ 0, con más de 2 decimales o no numérico |
| 401 | `UNAUTHORIZED` | Token vencido o inválido |
| 404 | `RECIPIENT_NOT_FOUND` | No existe un usuario con ese email |
| 410 | `QUOTE_EXPIRED` | La cotización venció antes de confirmar |
| 422 | `INSUFFICIENT_FUNDS` | No alcanza el saldo en esa moneda |
| 422 | `SELF_TRANSFER` | El destinatario es el mismo usuario |

## Archivos afectados
- `src/types/index.ts`: `Transaction`, `TransactionType`, `TransactionStatus`; se reemplaza `WalletTransaction`.
- `src/utils/money.ts`: `toCents()`, `fromCents()` y validación de monto.
- `src/services/transactionService.ts` (nuevo): `getTransactions`, `lookupUser`, `transfer`, `deposit`, `getExchangeQuote`, `exchange` y la clase `TransactionError` con el `code`.
- `src/services/walletService.ts`: el mock de `getBalances` lee la billetera mock del usuario logueado.
- `src/mocks/wallets.ts` (nuevo): billeteras y movimientos por email en `localStorage`. Los usuarios nuevos arrancan con saldo de prueba, y las transferencias entre usuarios mock acreditan al destinatario.
- `src/mocks/balances.ts`: se elimina. Los datos de prueba pasan a `mocks/wallets.ts` como saldo inicial de cada billetera.
- `src/mocks/users.ts`: login y registro con email y contraseña en modo mock, con dos cuentas de prueba (`valentina@latinzumi.test` y `mateo@latinzumi.test`, contraseña `LatinZumi1!`). Sin esto, al proteger `/dashboard` no se podía entrar sin backend.
- `src/services/authService.ts`: `login` y `register` usan el mock con `VITE_USE_MOCK=true`.
- `src/main.tsx`: `WalletProvider` dentro de `AuthProvider`.
- `src/context/wallet-context.ts`, `src/context/WalletProvider.tsx` y `src/hooks/useWallet.ts` (nuevos), con el mismo patrón que auth.
- `src/pages/Dashboard.tsx`: usa `useWallet()` y `useAuth()`. La transferencia pide el email del destinatario, busca su nombre con `lookupUser` y muestra un paso de confirmación antes de llamar al servicio.
- `src/utils/dashboard.ts`: cálculos en centavos y con los nuevos tipos.
- `src/App.tsx`: `/dashboard` siempre dentro de `ProtectedRoute`.

## Pasos
1. Pasar el contrato al equipo de backend y ajustar lo que cambien.
2. Tipos y utilidades de dinero en centavos.
3. Mock de billeteras en `localStorage` y `transactionService` (mock + real).
4. `WalletContext` y `useWallet`.
5. Dashboard: datos del contexto, usuario logueado y transferencia por email.
6. Proteger `/dashboard` también en modo mock.

## Cómo probar
- [x] Con `VITE_USE_MOCK=true`, el Dashboard muestra el nombre y los saldos del usuario logueado, no de "Valentina".
- [x] Una transferencia descuenta el saldo, aparece en "Actividad reciente" y sigue ahí después de recargar.
- [x] Transferir a otro usuario mock: al entrar con esa cuenta aparece como `transfer_received`.
- [x] Transferir más que el saldo muestra "No tenés saldo suficiente" y no cambia nada.
- [x] Transferir a un email inexistente o al propio muestra el error correspondiente.
- [x] Doble clic en "Confirmar" crea una sola transferencia.
- [x] `0.1 + 0.2` en ARS da exactamente `0,30`.
- [x] Sin sesión, `/dashboard` redirige a `/login` también en modo mock.
- [x] `npm run build` y `npx eslint .` sin errores.

## Riesgos / notas
- **El contrato puede cambiar** cuando lo revise el backend. Si cambia, se ajusta este spec antes de implementar.
- **Preguntas para el backend:**
  - ¿Los depósitos son reales (pasarela de pago) o un crédito de prueba por ahora?
  - ¿De dónde salen las cotizaciones del cambio de moneda? Hoy `ratesService` es simulado y no está conectado a ninguna API.
  - ¿Hay límites por operación o por día?
  - ¿`/users/lookup` puede devolver el nombre, o es un problema de privacidad? La alternativa es mostrarlo recién después de transferir.
- **El mock no es seguridad:** cualquiera puede editar `localStorage`. Solo sirve para desarrollar; las validaciones reales las hace el backend.
- **Cotizaciones:** los gráficos y el "saldo total unificado" siguen usando las cotizaciones simuladas hasta que haya una fuente real.
