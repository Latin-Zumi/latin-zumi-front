# Spec: Monto con separador de miles

## Fecha
2026-10-29

## Problema
La app muestra los montos con punto de miles ("Disponible: $ 1.500,50"), pero el campo de monto no lo aceptaba: `1.250` o `1.250.000,50` daban el error "con hasta dos decimales", que no explica qué estaba mal. En pesos colombianos pasa todo el tiempo, porque los montos son grandes (`1.250.000`).

## Solución propuesta
Aceptar el formato de Argentina y Colombia, donde el punto separa los miles y la coma marca los decimales, sin romper lo que ya funcionaba.

| Lo que escribe el usuario | Se lee como |
|---|---|
| `1.250,50` / `1.250.000` | punto de miles, coma decimal |
| `1250,5` | coma decimal, como antes |
| `1.250` / `100.000` | miles (grupos de 3 cifras) |
| `10.5` / `10.50` | punto decimal, como antes |
| `12.50,5` / `1.25.000` | error: puntos de miles mal puestos |
| `1,250.50` / `1,250,000` | error: formato de Estados Unidos |

El formato de Estados Unidos no se acepta a propósito: mezclado con el nuestro, `1,250` podría leerse como 1,25 y depositar otro monto.

El mensaje de error ahora trae un ejemplo: "Ingresá un monto mayor a cero, con hasta dos decimales. Por ejemplo: 1.250,50". Está en un solo lugar (`INVALID_AMOUNT_MESSAGE`) y lo usan los tres modales.

El backend no cambia: el front pasa el monto a su formato (`"1250.50"`) antes de mandarlo.

## Archivos afectados
- `src/utils/money.ts` (`parseAmountInput` e `INVALID_AMOUNT_MESSAGE`)
- `src/components/wallet/DepositModal.tsx`
- `src/components/wallet/ExchangeModal.tsx`
- `src/pages/Dashboard.tsx` (modal de transferencia)
- `tests/utils/money.test.ts`

## Pasos
1. Cambiar `parseAmountInput` y unificar el mensaje de error.
2. Tests de cada caso de la tabla.

## Cómo probar
- [x] `npm test`: 68 tests pasan.
- [x] `npm run build` y `npx eslint .` pasan.
- [x] En modo mock, en Depositar: `1,250.50` muestra el error con el ejemplo y `1.250.000,50` en COP pasa a la confirmación.
- [ ] Transferir y Cambiar con punto de miles.

## Riesgos / notas
- **`1.250` es ambiguo:** se lee como mil doscientos cincuenta, que es lo que espera alguien de Argentina o Colombia.
- **Pesos colombianos con centavos:** `formatMoney` muestra COP sin decimales, así que `1.250.000,50` se confirma como "COP 1.250.001" aunque se deposita 1.250.000,50. Ya pasaba antes de este cambio y queda para otra rama.
- **Rama `test/componentes`:** cuando se mergee, su nota sobre el separador de miles en la spec de componentes queda vieja.
