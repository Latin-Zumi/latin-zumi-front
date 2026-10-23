Spec: Tailwind estilos globales
Fecha
2026-10-23

Problema
La aplicación Latin Zumi necesita una base de estilos consistente y mobile‑first. Actualmente no hay un archivo global que defina tipografía, colores, botones, inputs y layout, lo que dificulta mantener coherencia visual.

Solución propuesta
Configurar una paleta de colores y estilos globales en TailwindCSS.

Definir variables de color y tipografía en tailwind.config.js.

Crear un archivo global.css con reglas base (body, h1-h6, a, button, input, card).

Usar mobile‑first con utilidades de Tailwind (sm:, md:, lg:).

Archivos afectados
src/styles/global.css

tailwind.config.js

Componentes que consumen clases globales (src/components/...)

Pasos
Configurar paleta y sombras en tailwind.config.js.

Crear global.css con @tailwind base; @tailwind components; @tailwind utilities;.

Definir estilos base con @layer base.

Importar global.css en main.tsx o index.tsx.

Probar en componentes (botones, cards, inputs).

Cómo probar
[ ] Verificar que el body tenga fondo claro y tipografía sans-serif.

[ ] Revisar que los botones primarios usen azul y hover más oscuro.

[ ] Confirmar que las cards tengan sombra y esquinas redondeadas.

[ ] Validar que inputs muestren borde azul al focus.

[ ] Probar layout mobile‑first en dashboard (columna → grid en pantallas grandes).

Riesgos / notas
Puede haber conflictos si ya existen estilos inline o librerías externas.

Es importante mantener consistencia en nombres de colores y clases.

La paleta debe revisarse con el equipo de diseño antes de fijarla como definitiva.