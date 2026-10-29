# Spec: Tests de utils

## Fecha
2026-10-29

## Problema
Las funciones de `src/utils` manejan lo más delicado de la app: montos en centavos, conversión entre monedas, el gráfico de actividad, el agrupado de movimientos y las reglas de la contraseña. No tenían tests, así que un cambio podía romperlas sin que nadie lo notara.

## Solución propuesta
Testear todas las funciones de `src/utils`. Son funciones puras (con los mismos datos siempre dan el mismo resultado), así que se prueban sin renderizar nada.

- **`money.ts`:**
  - formato de montos y del tipo de cambio;
  - `parseAmountInput` con montos válidos e inválidos;
  - centavos sin errores de redondeo;
  - saldo disponible y aviso de saldo insuficiente.
- **`transactions.ts`:**
  - descripción de cada movimiento;
  - agrupado por día ("Hoy", "Ayer", "Martes, 27 oct"), incluido el caso de "Ayer" cuando cambia el mes.
- **`dashboard.ts`:**
  - conversión entre monedas;
  - qué cuenta como ingreso o gasto (el cambio de moneda no cuenta);
  - actividad por día;
  - movimientos recientes, sin modificar la lista original.
- **`registration.ts`:**
  - requisitos de la contraseña, incluidas mayúsculas con tilde y contraseñas que son solo espacios;
  - mensaje de caracteres faltantes;
  - limpieza del nombre.
- **`login.ts`:** limpieza de espacios en el email.
- **`tests/helpers/factories.ts`:**
  - `makeTransaction` arma una transacción válida y cada test cambia solo lo que le importa;
  - `normalizeSpaces` compara montos formateados, porque `Intl` usa un espacio especial entre el símbolo y el número.

Los tests que dependen de la fecha usan un "hoy" fijo y cotizaciones fijas, así dan siempre el mismo resultado, sin importar el día en que se corran.

## Archivos afectados
- `tests/helpers/factories.ts` (nuevo)
- `tests/utils/money.test.ts`
- `tests/utils/transactions.test.ts` (nuevo)
- `tests/utils/dashboard.test.ts` (nuevo)
- `tests/utils/registration.test.ts` (nuevo)
- `tests/utils/login.test.ts` (nuevo)

## Pasos
1. Helpers compartidos.
2. Un archivo de test por cada archivo de `src/utils`.

## Cómo probar
- [x] `npm test`: 6 archivos y 33 tests pasan.
- [x] `npm run coverage`: `src/utils` queda en 97 % de líneas.
- [x] `npm run build` y `npx eslint .` pasan.

## Riesgos / notas
- **Sin test:** `formatTransactionDate` y `formatTransactionTime` solo llaman a `Intl` con un formato fijo; su resultado depende del navegador y de la zona horaria.
- **Zona horaria:** los tests arman las fechas en hora local, igual que la app, así que pasan en cualquier zona.
- **Siguiente rama:** tests de `services` (auth, wallet, transacciones) con `fetch` simulado.
