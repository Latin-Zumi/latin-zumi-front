# Spec: Operaciones con la API real

## Fecha
2026-11-03

## Problema
El back de Render ya tiene los endpoints de operaciones:

- `GET /wallet/transactions`
- `POST /wallet/deposits`
- `GET /wallet/exchange/quote`
- `POST /wallet/exchanges`
- `POST /wallet/transfers`

El front todavía los tiene apagados con `TRANSACTIONS_ENABLED`, porque antes no existían. Al compararlos con el código del back (`origin/main`) hay diferencias que hay que resolver antes de prenderlos:

- **Saldos.** Depósito, cambio y transferencia devuelven `balances` con el formato de `GET /accounts` (`id`, `balance`). El front los usa como si fueran `Balance` (`account_id`, `amount`), así que después de operar los saldos quedarían vacíos.
- **`null` en lugar de campos ausentes.** Los movimientos traen `counterparty: null` y `exchange: null`, y el tipo del front los declara opcionales.
- **Tipo `withdrawal`.** El historial puede traer retiros, que el front no conoce.
- **Códigos de error nuevos.** `QUOTE_ALREADY_USED`, `AMOUNT_TOO_SMALL`, `SAME_CURRENCY`, `CONVERSION_UNAVAILABLE` e `IDEMPOTENCY_CONFLICT` hoy caen en el mensaje genérico.

## Solución propuesta
- **`walletService`** exporta `toBalance`, el mapeo de una cuenta de `/accounts` a `Balance`. Lo usan `getBalances()` y las operaciones.
- **`transactionService`**, con la API real, normaliza cada respuesta antes de devolverla:
  - `balances` pasan por `toBalance`;
  - `counterparty` y `exchange` en `null` quedan ausentes.

  El mock ya devuelve el formato del front y no cambia.
- **`withdrawal`** se suma a `TransactionType`, con la etiqueta "Retiro". Cuenta como egreso.
- **Códigos de error nuevos** con su mensaje. `QUOTE_ALREADY_USED` se trata igual que `QUOTE_EXPIRED` en el modal de cambio: hay que pedir otra cotización.
- **`TRANSACTIONS_ENABLED = true`** también con la API real. Se muestran Depositar, Cambiar, Transferir y el historial.
- **`GOOGLE_AUTH_ENABLED` sigue en `false`.** `POST /auth/google` ya existe, pero el CORS del back solo permite `GET` y `POST`. Sin `PATCH`, un usuario nuevo de Google queda trabado en `/completar-perfil`. Además faltan confirmar las variables `VITE_FIREBASE_*` en Vercel.

## Archivos afectados
- `src/services/walletService.ts`: `AccountResponse` y `toBalance` exportados.
- `src/services/transactionService.ts`: normalización de respuestas y códigos de error nuevos.
- `src/types/index.ts`: `withdrawal` y códigos de error.
- `src/utils/transactions.ts`: etiqueta "Retiro".
- `src/components/wallet/ExchangeModal.tsx`: `QUOTE_ALREADY_USED` como cotización vencida.
- `src/config/features.ts`: `TRANSACTIONS_ENABLED = true`.
- `tests/services/transactionService.test.ts`: casos de normalización y de errores nuevos.

## Pasos
1. Exportar `toBalance` y usarlo en `getBalances()`.
2. Normalizar las respuestas de las operaciones y del historial.
3. Sumar `withdrawal` y los códigos de error nuevos.
4. Prender `TRANSACTIONS_ENABLED`.
5. Tests.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [ ] Con la API real: depositar, cambiar y transferir actualizan los saldos y aparecen en el historial.
- [ ] Repetir un cambio con una cotización ya usada pide una nueva.
- [ ] Con `VITE_USE_MOCK=true` todo sigue funcionando igual.

## Riesgos / notas
- **Los depósitos se acreditan siempre en la moneda principal de la billetera.** El back convierte el monto. Si depositás 100 USD y tu moneda principal es ARS, recibís pesos. El modal deja elegir la moneda y no lo avisa. Hay que definir con back si es lo que quieren; se relaciona con "comprar/vender moneda" y "cambiar de moneda desde la billetera". El mock acredita en la moneda elegida, así que en modo mock no se ve.
- **Transferencias: decidido con back que quien recibe la plata la recibe en la moneda que le enviaron.** Si le mandan dólares, recibe dólares, y después cambia si quiere.
  - El front y el mock ya funcionan así.
  - El back de hoy (`transfers.service.ts`) todavía convierte a la moneda principal de quien recibe. Back tiene que cambiarlo, y crear la cuenta en esa moneda si quien recibe no la tiene.
- **Pedido a back:** agregar `'PATCH'` a `methods` en `src/config/cors.ts`, para poder prender Google.
- **Pedido a back:** la `Idempotency-Key` es única para todos los usuarios, no por usuario. Un usuario puede bloquear la operación de otro si repite su clave.
- El front genera una clave nueva por operación, así que no lo afecta en uso normal.
