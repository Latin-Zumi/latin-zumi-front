# Spec: Componente Button con Spinner

## Fecha
2026-10-23

## Problema
Necesitamos un botón reutilizable que soporte variantes (`solid`, `link`), tamaños (`sm`, `md`, `lg`) y estados (`disabled`, `loading`).  
Actualmente no existe un componente estándar que combine accesibilidad, consistencia visual y feedback de carga.

## Solución propuesta
Implementar un componente `Button` en React + TypeScript:
- API clara con props tipadas (`variant`, `size`, `onClick`, `disabled`, `loading`, `href`, `target`).
- Renderizado condicional:
  - `solid`: `<button>` con soporte para `loading` → muestra `<Spinner size="sm" />` + texto `"Cargando…"`.
  - `link`: `<a>` con clases dinámicas y soporte para `href` + `target`.
- Reutiliza el componente `Spinner` para feedback visual de carga.
- Usa clases globales (`btn`, `btn-link`, `btn-{size}`).

## Archivos afectados
- `src/components/Button.tsx`
- `src/components/Spinner.tsx` (importado)
- `tests/Button.test.tsx`

## Pasos
1. Definir tipos `ButtonBaseProps`, `SolidButtonProps`, `LinkButtonProps`.
2. Crear unión `ButtonProps`.
3. Implementar renderizado condicional según `variant`.
4. Integrar `Spinner` en estado `loading`.
5. Exportar componente y documentar spec.

## Cómo probar
- [ ] Renderizar `<Button variant="solid">Guardar</Button>` → debe mostrar un `<button>` con clase `btn btn-md`.
- [ ] Renderizar `<Button variant="solid" loading>Guardar</Button>` → debe mostrar `<Spinner size="sm" /> Cargando…`.
- [ ] Renderizar `<Button variant="link" href="/home">Inicio</Button>` → debe renderizar `<a>` con clase `btn-link btn-md`.
- [ ] Verificar que `disabled` deshabilita el botón en variante `solid`.

## Riesgos / notas
- Depende de que las clases CSS (`btn`, `btn-link`, `btn-{size}`) estén definidas en `global.css`.
- Posible extensión futura: añadir variantes de color (`primary`, `secondary`) o íconos.