# Spec: Componente Spinner

## Fecha
2026-10-23

## Problema
Necesitamos un indicador de carga reutilizable y accesible para mostrar estados de espera en la interfaz.  
Actualmente no existe un componente estándar que cumpla con accesibilidad y soporte distintos tamaños.

## Solución propuesta
Implementar un componente `Spinner` en React + TypeScript:
- API clara con props tipadas (`size`, `label`).
- Renderizado como `<span>` con clases globales (`ui-spinner`, `ui-spinner--{size}`).
- Accesible: `role="status"` y `aria-label` para lectores de pantalla.
- Valores por defecto: `size="md"`, `label="Cargando"`.

## Archivos afectados
- `src/components/Spinner.tsx`
- `src/styles/global.css` (clases `ui-spinner`, variantes de tamaño)
- `tests/Spinner.test.tsx`

## Pasos
1. Definir tipo `SpinnerSize` con valores `"sm" | "md" | "lg"`.
2. Crear componente `Spinner` con props tipadas.
3. Aplicar clases dinámicas según `size`.
4. Añadir atributos de accesibilidad (`role`, `aria-label`).
5. Exportar componente por defecto.
6. Documentar uso en README/spec.

## Cómo probar
- [ ] Renderizar `<Spinner />` sin props → debe mostrar tamaño `md` y label `"Cargando"`.
- [ ] Renderizar `<Spinner size="sm" />` → debe aplicar clase `ui-spinner--sm`.
- [ ] Renderizar `<Spinner label="Loading data" />` → debe tener `aria-label="Loading data"`.
- [ ] Verificar que el componente se renderiza con `role="status"`.

## Riesgos / notas
- Necesario definir estilos CSS (`ui-spinner`, animación de rotación, variantes de tamaño).
- Si no se agregan las clases en `global.css`, el componente no tendrá apariencia visual.
- Posible extensión futura: añadir colores o variantes de animación.