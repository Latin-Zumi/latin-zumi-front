# Spec: Saldo disponible en Transferir y Cambiar

## Fecha
2026-10-29

## Problema
En los modales de Transferir y Cambiar no se ve cuánta plata hay en la moneda elegida. Para saberlo hay que cerrar el modal y mirar el Dashboard. Además, el aviso "No tenés saldo suficiente" recién aparece al tocar Continuar o Cotizar.

## Solución propuesta
Mostrar el saldo de la moneda elegida dentro del modal y avisar mientras se escribe si el monto lo supera.

- **"Disponible":** debajo de la moneda (en Cambiar, la que entregás) se muestra "Disponible: $ 118.200,00", que se actualiza al cambiar de moneda.
- **"Usar todo":** completa el monto con el saldo entero. No aparece si el saldo es 0.
- **Aviso al escribir:** si el monto supera lo disponible, el campo muestra "No tenés saldo suficiente en esa moneda." mientras se escribe. El control al enviar se mantiene.
- **Lector de pantalla:** el disponible queda asociado al campo de monto con `aria-describedby`; al entrar al campo se lee "Monto, disponible $ 118.200,00".
- **Al cerrar:** la moneda y el monto se reinician, como antes, cuando el formulario no estaba controlado.
- **Depositar:** queda igual; para depositar no hace falta saldo.
- **Botones del pie:** en los tres modales (Transferir, Cambiar y Depositar), Cancelar y Volver pasan a botón con borde, para que no se confundan con la acción principal (Continuar, Cotizar, Confirmar), que sigue con relleno.

## Archivos afectados
- `src/components/wallet/AvailableBalance.tsx` (nuevo)
- `src/utils/money.ts`: `getAvailableAmount` y `getInsufficientFundsError`.
- `src/pages/Dashboard.tsx`: moneda y monto de la transferencia controlados.
- `src/components/wallet/ExchangeModal.tsx`: moneda de origen y monto controlados.
- `src/components/wallet/DepositModal.tsx`: Cancelar y Volver con borde.
- `src/styles/wallet/available-balance.css` (nuevo) e `src/styles/index.css`.

## Pasos
1. Componente `AvailableBalance` y funciones en `money.ts`.
2. Transferir: moneda y monto controlados, disponible y aviso.
3. Cambiar: lo mismo para la moneda que entregás.

## Cómo probar
- [x] `npm run build` y `npx eslint .` pasan.
- [x] Transferir muestra el disponible de ARS y, al elegir USD, el de USD.
- [x] Un monto mayor al disponible muestra el aviso mientras se escribe y marca el campo como inválido.
- [x] "Usar todo" completa el monto (por ejemplo `1070,50`) y el aviso desaparece.
- [x] Al cerrar y volver a abrir Transferir, la moneda y el monto vuelven al inicio.
- [x] Cambiar muestra el disponible de la moneda que entregás; con "Usar todo" la cotización sale bien.
- [ ] Confirmar una transferencia y un cambio completos y ver que el disponible se actualice.

## Riesgos / notas
- **API real:** sin `TRANSACTIONS_ENABLED` los botones no se muestran, así que esto solo se ve en modo mock hasta que el backend tenga los endpoints.
- **Saldo actualizado:** el disponible sale del contexto de la billetera; si el saldo cambia desde otra pestaña, se actualiza al recargar, igual que el resto del Dashboard.
