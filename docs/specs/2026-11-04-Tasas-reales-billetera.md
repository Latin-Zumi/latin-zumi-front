# Spec: Tasas y costos reales en la billetera

## Fecha
2026-11-04

## Problema
La billetera tiene que mostrar las tasas, la comisión y el interés, no solo el modal de cambio. Hoy:

- Las tasas salen de `mocks/rates`, también en producción, y no coinciden con la cotización real del modal.
- "Comisión 0 %" e "Interés 0 %" están escritos a mano: si cambian en el panel, la billetera sigue diciendo 0 %.
- Un usuario con una sola moneda no ve ninguna tasa, y el back crea una sola cuenta al registrarse.
- El resumen de "Esta semana" convierte los movimientos con las tasas simuladas.

## Solución propuesta
Usar `GET /wallet/rates`, definido en `2026-11-04-Tasas-billetera-backend.md`.

- **Tasas:** se muestran los seis pares entre USD, EUR, ARS y COP, sin depender de los saldos, con la fecha de actualización.
- **Comisión e interés:** se muestran los valores del back, para que 0 % sea un dato real. Si el interés es distinto entre monedas, se muestra uno por moneda.
- **Si falla:** no se muestra ningún valor. La sección avisa y permite reintentar, y "Esta semana" indica que no se puede calcular.
- **Mock:** comisión e interés salen de los parámetros del panel de admin. La cotización simulada usa esa misma comisión en lugar de 1,5 % fijo.

El gráfico de la home sigue simulado y lo avisa: el back no tiene historial de cotizaciones.

## Archivos afectados
- `src/services/ratesService.ts`, `src/hooks/useWalletRates.ts` (nuevo), `src/types/index.ts`
- `src/components/wallet/WalletRatesAndCosts.tsx`, `src/pages/Dashboard.tsx`, `src/styles/pages/dashboard.css`
- `src/utils/dashboard.ts`
- `src/mocks/settings.ts` (nuevo), `src/mocks/rates.ts`, `src/mocks/admin.ts`, `src/mocks/wallets.ts`
- `tests/services/ratesService.test.ts` (nuevo), `tests/hooks/useWalletRates.test.ts` (nuevo)
- `tests/components/wallet/WalletRatesAndCosts.test.tsx`, `tests/utils/dashboard.test.ts`

## Pasos
1. Servicio, mock y hook.
2. Billetera y resumen semanal.
3. Tests.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Con `VITE_USE_MOCK=true`: se ven los seis pares y comisión e interés en 0 %.
- [x] Con `VITE_USE_MOCK=true`: una comisión cargada en el panel se ve en la billetera y en el modal de cambio.
- [x] En 375 px se ve sin desbordarse a lo ancho.
- [x] Con la API sin el endpoint: avisa que no pudo cargar, sin mostrar valores, y el reintento vuelve a pedir.
- [ ] Con la API real: las tasas de la billetera coinciden con la cotización del modal, con comisión en 0 %.
- [ ] Con la API real: un usuario con una sola moneda ve todas las tasas.

## Riesgos / notas
- **Mergear después de que el back despliegue `GET /wallet/rates`.** Sin el endpoint, la billetera avisa que no pudo cargar las tasas y deja de mostrar "Esta semana".
- La comisión de producción tiene que volver a 0 % desde el panel; la última vez que se revisó estaba en 3 %.
