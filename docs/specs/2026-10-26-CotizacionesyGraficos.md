# Spec: Cotizaciones y gráficos en Home

# Fecha
2026-10-26

# Problema
La aplicación necesita mostrar cotizaciones de monedas en la vista Home, con datos históricos y visualizaciones claras. Hasta ahora no había componentes para representar tendencias ni gráficos interactivos.

# Solución propuesta
Implementar mockRateHistory para simular 90 días de cotizaciones con semilla reproducible.

Crear RateCard que muestre:

Nombre y símbolo de la moneda.

Valor actual por 1 USD.

Sparkline con tendencia.

Indicador de subida/bajada.

Crear Sparkline como gráfico compacto embebido en cada tarjeta.

Crear RateChart como gráfico detallado con:

Área y línea histórica.

Ticks en ejes X/Y.

Tooltip accesible y navegación con teclado.

Integrar todo en Home para mostrar cotizaciones públicas y restringir operaciones a usuarios autenticados.

# Archivos afectados
src/mocks/mockRateHistory.ts

src/components/rates/RateCard.tsx

src/components/rates/RateChart.tsx

src/components/charts/Sparkline.tsx

src/views/Home.tsx

src/global.css (estilos para rate‑card, rate‑chart, sparkline)

# Pasos
Definir mock de cotizaciones con buildHistory.

Implementar RateCard con sparkline y trend pill.

Implementar Sparkline para gráficos compactos.

Implementar RateChart para gráficos completos con tooltip.

Integrar en Home mostrando cotizaciones y restringiendo acciones.

Agregar estilos globales para consistencia visual.

# Cómo probar
[ ] Renderizar Home sin usuario → deben mostrarse cotizaciones y botones de login/register.

[ ] Renderizar Home con usuario → deben mostrarse cotizaciones y botones de acción habilitados.

[ ] Verificar que RateCard muestra tendencia correcta según datos.

[ ] Verificar que RateChart responde a resize, pointer y teclado.

[ ] Verificar que Sparkline se renderiza correctamente dentro de cada tarjeta.

# Riesgos / notas
Los datos son simulados, no reales.

En producción se reemplazarán por API de cotizaciones.

Los estilos deben ser consistentes y accesibles.