# Spec: Estilos globales con Tailwind CSS

## Fecha
2026-10-23

## Problema
La aplicación Latin Zumi necesita una base de estilos consistente y mobile-first. Actualmente no hay un archivo global que defina tipografía, colores, botones, inputs y layout, lo que dificulta mantener la coherencia visual.

## Solución propuesta
Configurar una paleta de colores y estilos globales con Tailwind CSS:
- Definir colores y tipografía en `tailwind.config.js`.
- Crear `src/styles/global.css` con estilos base para `body`, encabezados, enlaces, botones, inputs e imágenes.
- Usar utilidades de Tailwind con un enfoque mobile-first (`sm:`, `md:`, `lg:`).

## Archivos afectados
- `src/styles/global.css`
- `tailwind.config.js`
- `src/main.tsx`
- Componentes que consumen las clases globales en `src/components/`

## Pasos
1. Configurar la paleta de colores y las sombras en `tailwind.config.js`.
2. Crear `global.css` con las directivas de Tailwind y reglas dentro de `@layer base`.
3. Importar `global.css` desde `main.tsx`.
4. Probar los estilos en botones, tarjetas e inputs.

## Cómo probar
- [ ] Verificar que el `body` tenga un fondo claro y tipografía sans-serif.
- [ ] Revisar que los botones primarios usen azul y un tono más oscuro al pasar el cursor.
- [ ] Confirmar que las tarjetas tengan sombra y esquinas redondeadas.
- [ ] Validar que los inputs muestren un borde azul al recibir el foco.
- [ ] Probar el layout mobile-first en el dashboard: columna en pantallas pequeñas y grilla en pantallas grandes.

## Riesgos / notas
- Puede haber conflictos con estilos inline o librerías externas.
- Es importante mantener la coherencia en los nombres de colores y clases.
- La paleta debe revisarse con el equipo de diseño antes de fijarla como definitiva.
