# Spec: Estilos de billetera y gráficos de cotizaciones en Home

## Fecha
2026-10-26

## Problema
- La app todavía no se ve como una billetera virtual. `index.css` trae restos de la plantilla de Vite: `#root` angosto con bordes, texto centrado y títulos de 56px que pisan los estilos de Tailwind.
- El Home muestra las cotizaciones como una lista de texto, sin indicar si cada moneda sube o baja.
- El Footer usa `.site-footer`, `.footer-nav` y `.footer-credits`, pero esas clases no tienen estilos, así que los enlaces se ven pegados.

## Solución propuesta
- Limpiar `index.css` y definir una identidad de billetera en `global.css`: tarjetas con sombra suave, header fijo arriba y un hero azul con gradiente.
- En el Home:
  - Una tarjeta por moneda (EUR, ARS, COP contra USD) con la cotización, la variación en % (▲ verde si sube, ▼ rojo si baja, con flecha y texto, no solo color) y un sparkline.
  - Un gráfico de línea grande para la moneda elegida, con selector de período (7D / 30D / 90D) y un tooltip que sigue al cursor.
  - Una tabla accesible con los mismos datos.
- Los gráficos se dibujan con SVG propio, sin agregar dependencias.
- Las cotizaciones salen de un mock con historial (`src/mocks/rates.ts`) a través de `ratesService`, igual que los balances, listo para cambiarse por una API.
- Agregar los estilos que faltan del Footer.
- Login y Register se muestran dentro de una tarjeta centrada.

## Archivos afectados
- src/index.css
- src/styles/global.css
- src/mocks/rates.ts (nuevo)
- src/services/ratesService.ts (nuevo)
- src/components/charts/Sparkline.tsx (nuevo)
- src/components/charts/RateChart.tsx (nuevo)
- src/components/wallet/RateCard.tsx (nuevo)
- src/pages/Home.tsx
- src/pages/Login.tsx, src/pages/Register.tsx

## Pasos
1. Limpiar `index.css`.
2. Crear el mock de historial y el servicio de cotizaciones.
3. Crear Sparkline, RateChart y RateCard.
4. Rediseñar Home: hero, tarjetas, gráfico, tabla y acciones.
5. Agregar estilos de Footer, tarjetas de auth y ajustar el header.

## Cómo probar
- [x] `/` sin sesión → hero, 3 tarjetas con variación y sparkline, gráfico y botones Ingresar / Crear cuenta.
- [x] La variación positiva se ve verde con ▲ y la negativa roja con ▼.
- [x] Clic en una tarjeta → el gráfico grande cambia a esa moneda.
- [x] El selector 7D / 30D / 90D cambia el rango y la variación.
- [x] Al pasar el mouse sobre el gráfico aparecen la línea guía y el tooltip con fecha y valor.
- [x] El Footer muestra los enlaces separados y los créditos.
- [x] En móvil (375px) todo entra sin scroll horizontal.
- [x] `npm run build` y `npm run lint` pasan.

## Riesgos / notas
- Las cotizaciones son simuladas: se generan de forma determinística para que siempre se vean iguales.
- Las variaciones se calculan contra el primer punto del período elegido.
