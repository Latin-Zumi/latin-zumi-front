# Spec: Paginar el historial de movimientos

## Fecha
2026-11-04

## Problema
`/historial` muestra los movimientos que carga la billetera, que son solo los últimos 20, y los filtra en el navegador. Un usuario con más movimientos no puede ver los anteriores, y los filtros no los encuentran.

## Solución propuesta
La pantalla pide sus propios movimientos a `GET /wallet/transactions`, con `page`, `limit`, `type`, `currency`, `from` y `to`:

- Muestra 20 movimientos por página, con "Anterior" y "Siguiente". Si todo entra en una página, no muestra la paginación.
- Cambiar un filtro vuelve a la primera página.
- Las fechas se mandan como instantes del día local del usuario, porque el back los pide con zona horaria.
- Si "Desde" es posterior a "Hasta", avisa y no llama al back, que respondería `400`.
- Un `401` cierra la sesión, igual que en la billetera.
- El mock acepta `from` y `to`, y ordena del más reciente al más antiguo, como el back.

La billetera sigue cargando sus últimos 20 movimientos para el dashboard.

"Interés" no se ofrece como filtro: el back responde `400` a `type=interest`. Los intereses sí aparecen en la lista. Cuando el back lo acepte, se agrega a `FILTERABLE_TRANSACTION_TYPES`.

## Archivos afectados
- `src/pages/TransactionHistory.tsx`
- `src/services/transactionService.ts`
- `src/mocks/wallets.ts`
- `src/styles/pages/transaction-history.css`
- `tests/pages/TransactionHistory.test.tsx`, `tests/services/transactionService.test.ts`

## Pasos
1. Sumar `from` y `to` al servicio y al mock.
2. Hacer que la pantalla pida los movimientos y agregar la paginación.
3. Actualizar los tests.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Con `VITE_USE_MOCK=true`, los filtros y las fechas piden y muestran lo que corresponde.
- [ ] Con la API real y más de 20 movimientos: "Siguiente" muestra los anteriores.
- [ ] Con la API real: filtrar por fecha incluye los movimientos del primer y del último día elegidos.

## Riesgos / notas
- Cada cambio de filtro o de página hace un pedido al back. `GET /wallet/transactions` no tiene límite de pedidos.
- Si llega un movimiento nuevo mientras se navega, los siguientes pueden correrse un lugar entre páginas. Es lo normal en una paginación por número de página.
