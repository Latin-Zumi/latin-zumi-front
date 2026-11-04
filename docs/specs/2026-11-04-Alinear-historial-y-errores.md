# Spec: Filtro de interés y error de monto máximo

## Fecha
2026-11-04

## Problema
Quedan dos diferencias con el back:

- `/historial` muestra los movimientos de interés, pero no permite filtrarlos. El filtro se había sacado porque el back respondía `400`, y ya acepta `type=interest`.
- El back puede responder `AMOUNT_TOO_LARGE` cuando un monto convertido supera el máximo, y el front muestra un mensaje genérico.

## Solución propuesta
- Agregar "Interés" a las opciones del filtro de `/historial`.
- Agregar `AMOUNT_TOO_LARGE` a los errores de operaciones, con un mensaje propio.

## Archivos afectados
- `src/utils/transactions.ts`
- `src/types/index.ts`, `src/services/transactionService.ts`
- `tests/utils/transactions.test.ts`, `tests/services/transactionService.test.ts`

## Pasos
1. Agregar la opción del filtro.
2. Agregar el error y su mensaje.
3. Actualizar los tests.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Con `VITE_USE_MOCK=true`: el filtro ofrece "Interés" y muestra solo esos movimientos.
- [x] El back responde `200` a `GET /wallet/transactions?type=interest`.

## Riesgos / notas
El texto de `AdminSettings.tsx:183` no cambia: depende de que se confirme la regla de cálculo del interés (B-01).
