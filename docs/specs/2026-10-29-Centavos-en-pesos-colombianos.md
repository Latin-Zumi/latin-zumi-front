# Spec: Centavos en pesos colombianos

## Fecha
2026-10-29

## Problema
`formatMoney` muestra el peso colombiano sin decimales, que es su formato habitual. Pero si el monto tiene centavos, los redondea: al depositar `1250000,50` la confirmación decía "COP 1.250.001", aunque se deposita 1.250.000,50. El usuario confirmaba un monto distinto del que veía.

## Solución propuesta
Si el monto tiene centavos, mostrarlos siempre con dos decimales. Si no tiene, cada moneda sigue con su formato de siempre.

| Monto | Antes | Ahora |
|---|---|---|
| COP 1392000 | COP 1.392.000 | COP 1.392.000 |
| COP 1250000.50 | COP 1.250.001 | COP 1.250.000,50 |
| ARS 118200 | $ 118.200,00 | $ 118.200,00 |
| USD 1070.5 | US$ 1.070,50 | US$ 1.070,50 |

Como `formatMoney` muestra todos los montos de la app, el cambio aplica en todos lados: saldos, movimientos, historial, gráfico y confirmaciones de los modales.

## Archivos afectados
- `src/utils/money.ts` (`formatMoney`)
- `tests/utils/money.test.ts`

## Pasos
1. Mostrar dos decimales cuando el monto tiene centavos.
2. Tests de COP con y sin centavos, y de que las demás monedas no cambian.

## Cómo probar
- [x] `npm test`: 97 tests pasan.
- [x] `npm run build` y `npx eslint .` pasan.
- [x] En modo mock: el dashboard sigue mostrando "COP 1.392.000" y "−COP 42.000"; al depositar `1250000,50` en COP, la confirmación dice "COP 1.250.000,50".
- [ ] Historial y "Esta semana" con la moneda preferida en COP.

## Riesgos / notas
- **Totales convertidos:** si la moneda preferida es COP, los totales de "Esta semana" salen de convertir otras monedas y pueden tener centavos. Ahora se ven con ",xx" en vez de redondeados. Es el monto real, pero se ve distinto que antes.
- **Rama `fix/monto-separador-miles`:** también cambia `src/utils/money.ts`, pero en otra función (`parseAmountInput`), así que no deberían chocar al mergear.
