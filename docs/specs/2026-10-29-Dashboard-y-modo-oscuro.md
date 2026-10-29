# Spec: Rediseño del Dashboard y modo oscuro

## Fecha
2026-10-29

## Problema
El instructor marcó que los estilos se notan hechos con IA:

- títulos chiquitos en mayúsculas sobre cada bloque;
- hero con degradé azul genérico;
- tarjetas blancas todas iguales;
- paleta azul por defecto y la fuente del sistema;
- el saldo total repetido dos veces en el Dashboard.

Además, la app no tiene modo oscuro.

## Solución propuesta
La idea es que la app se sienta nuestra: que el naranja del logo sea el color principal, que el Dashboard muestre primero lo que más importa (cuánta plata tenés) y sumar un modo oscuro con tonos cálidos, que combina con la marca.

- **Colores por variables:** `global.css` define los colores del modo claro en `@theme`, y `:root[data-theme="dark"]` los pisa con los del oscuro. Los componentes usan las mismas utilidades (`bg-background`, `text-foreground`…), así que no se duplica nada.
  - Claro: fondo crema `#fbf6ef`, tinta `#1f1a16` y el naranja de marca `#ef7a38`.
  - Oscuro: fondo casi negro `#0b0505`, texto rosado claro `#f6e9ea` y acento coral `#ff7a85`.
- **`primary-strong`:** el naranja como texto sobre crema no llega al contraste 4.5:1, así que los textos y links usan `--color-primary-strong`; `primary` queda para fondos de botones, con texto oscuro encima.
- **Bloques destacados:** el hero de Home/Nosotros y la tarjeta "Esta semana" usan `--color-feature-from/to`, que son oscuros en los dos modos. La clase `.feature-surface` ajusta los textos del modo claro dentro de esos bloques.
- **Tipografías:** Archivo para títulos y números grandes, Instrument Sans para el resto (Google Fonts).
- **Tema:**
  - Un script en `index.html` aplica el tema antes de pintar, para que no parpadee: la elección guardada en `localStorage` (`latin-zumi:theme`) o, si no hay, la del sistema.
  - `useTheme` cambia el tema y lo guarda.
  - `ThemeToggle` (luna/sol) está en la barra de navegación, visible con o sin sesión.
- **Dashboard:**
  - Saludo, saldo grande de la moneda del usuario y las otras monedas en una frase ("También tenés…").
  - Botones Depositar (relleno), Transferir y Cambiar (borde), solo con `TRANSACTIONS_ENABLED`.
  - Movimientos recientes agrupados por día ("Hoy", "Ayer", "Martes, 27 oct") con link a "Ver todos" (`/historial`).
  - Tarjeta "Esta semana" con el gráfico de 7 días y lo que entró y salió.
  - Se sacan el saldo total duplicado, las tarjetas por moneda, la tabla de saldos, la tarjeta de historial y el bloque "Tu cuenta".

## Archivos afectados
- `index.html`: fuentes y script de tema.
- `src/styles/global.css`: colores claro/oscuro, `primary-strong`, `feature-*` y fuentes.
- `src/styles/base.css`, `components/buttons.css`, `layout/navbar.css`, `pages/*.css`, `wallet/rate-card.css`: textos con `primary-strong`, botón `btn-outline`, botón de tema y estilos nuevos del Dashboard.
- `src/hooks/useTheme.ts` (nuevo)
- `src/components/common/ThemeToggle.tsx` (nuevo) y `Navbar.tsx`
- `src/components/ui/Button.tsx`: prop `outline`.
- `src/pages/Dashboard.tsx`
- `src/utils/transactions.ts`: `formatTransactionTime` y `groupTransactionsByDay`.
- `src/utils/dashboard.ts`: se borran `calculateTotalBalance` y `calculateSpentToday`, que quedaron sin uso.
- `src/components/wallet/BalanceCard.tsx` y `BalanceTable.tsx`: se borran, quedaron sin uso.

## Pasos
1. Variables de color claro/oscuro y fuentes.
2. Script de tema, `useTheme` y `ThemeToggle`.
3. Reemplazar `text-primary` por `text-primary-strong` donde es texto.
4. Rediseñar el Dashboard y limpiar lo que quedó sin uso.

## Cómo probar
- [x] `npm run build` y `npx eslint .` pasan.
- [x] Sin elección guardada, la app arranca con el modo del sistema.
- [x] El botón luna/sol cambia el modo, se guarda y se mantiene al recargar y al navegar.
- [x] Dashboard en modo mock: saldo grande, otras monedas en la frase, movimientos por día, tarjeta de la semana y modales de depósito, cambio y transferencia.
- [x] Home e Historial se ven bien en modo oscuro.
- [ ] Nosotros, Login y Registro en los dos modos.
- [x] En celular (375 px) no hay scroll horizontal y los botones bajan de línea.
- [ ] Con la API real (`VITE_USE_MOCK=false`): saldo de `GET /accounts`, sin frase de otras monedas y sin botones de operaciones.

## Riesgos / notas
- **Logo:** es un PNG pensado para fondo claro; en modo oscuro se lee, pero conviene pedir una versión para fondo oscuro.
- **"Entró" y "Salió":** son estimados en la moneda del usuario, igual que el gráfico (cotizaciones simuladas).
- **Títulos en mayúsculas:** el Historial todavía usa `dashboard__eyebrow` ("TU BILLETERA").
- **Fuentes externas:** dependen de Google Fonts; si no cargan, se usa la fuente del sistema.
