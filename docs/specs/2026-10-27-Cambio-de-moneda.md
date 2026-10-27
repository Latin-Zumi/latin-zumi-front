# Spec: Cambio de moneda con mock

## Fecha
2026-10-27

## Problema
El usuario tiene saldo en cuatro monedas (ARS, COP, USD y EUR) pero no puede pasar plata de una a otra. `getExchangeQuote` y `exchange` ya existen en `transactionService` (con su mock) desde la spec de transacciones, pero no hay pantalla que los use.

## Solución propuesta
Un botón **Cambiar** en el Dashboard, junto a **Depositar** y **Transferir**, que abre un modal de dos pasos:

1. **Formulario:** moneda de origen (por defecto la preferida), moneda de destino y monto. Se valida antes de cotizar:
   - las monedas tienen que ser distintas;
   - monto mayor a cero, con hasta dos decimales;
   - saldo suficiente en la moneda de origen.

   El botón **Cotizar** pide la cotización (`GET /wallet/exchange/quote`).
2. **Confirmación:**
   - Muestra cuánto se entrega y cuánto se recibe: "Entregás $ 1.000,00 y recibís US$ 0,69".
   - Muestra el tipo de cambio en el sentido más legible: "1 USD = 1.445,00 ARS" en vez de "1 ARS = 0,0007 USD".
   - Muestra la cuenta regresiva hasta que vence la cotización: "Cotización válida por 45 s".
   - Al confirmar se llama a `exchange(quote_id)` con una `Idempotency-Key` (`POST /wallet/exchanges`).

Si la cotización vence antes de confirmar (o el servidor responde `QUOTE_EXPIRED`), se deshabilita **Confirmar** y aparece **Actualizar cotización**, que pide una nueva con los mismos datos.

En "Actividad reciente", el cambio se muestra con el icono ⇄ y los dos montos ("−$ 1.000,00 → +US$ 0,69"), sin color de ingreso ni de gasto. Como hasta ahora, no cuenta como ingreso ni como gasto en el gráfico.

Usa los endpoints del contrato de `2026-10-27-Transacciones-contrato-y-mock.md`, sin cambios.

## Archivos afectados
- `src/context/wallet/WalletContext.ts` y `WalletProvider.tsx`: se agrega `exchange(quoteId, idempotencyKey)`.
- `src/components/wallet/ExchangeModal.tsx` (nuevo): formulario, cotización con cuenta regresiva y confirmación.
- `src/utils/money.ts`: `formatExchangeRate()`, que muestra el tipo de cambio en el sentido más legible.
- `src/pages/Dashboard.tsx`: botón **Cambiar** y movimientos de tipo `exchange` en "Actividad reciente".
- `src/styles/pages/dashboard.css`: estilo neutro para el icono y el monto de los cambios.

## Pasos
1. `exchange()` en el contexto.
2. `formatExchangeRate()`.
3. `ExchangeModal`.
4. Botón en el Dashboard y cómo se ve el cambio en la actividad.

## Cómo probar
- [x] Cambiar 1.000 ARS a USD descuenta exactamente $ 1.000,00 de ARS y suma lo cotizado en USD.
- [x] El cambio aparece en "Actividad reciente" con los dos montos y sigue ahí después de recargar.
- [x] Misma moneda de origen y destino, monto inválido o saldo insuficiente muestran un error y no cotizan.
- [x] La cuenta regresiva baja; al llegar a 0 se deshabilita "Confirmar" y "Actualizar cotización" trae una nueva.
- [x] Doble clic en "Confirmar cambio" hace un solo cambio.
- [x] "Volver" conserva los datos cargados.
- [x] El cambio no suma al "Enviado hoy" ni al gráfico.
- [x] `npm run build` y `npx eslint .` sin errores.

## Riesgos / notas
- **Cotizaciones simuladas:** en el mock salen de `mocks/rates.ts` y no se conectan a ninguna API. La fuente real la define el backend (pregunta abierta en la spec de transacciones).
- **Comisión o spread:** el contrato no contempla comisión. Si el backend cobra, hay que agregarla a la cotización.
- **Duración de la cotización:** el mock usa 60 segundos; el valor real lo decide el backend con `expires_at`.
- **Merge:** esta rama sale de `refactor/contextos-por-carpeta`, así que ese PR tiene que mergearse antes que este.
