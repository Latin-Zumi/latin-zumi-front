# Spec: El campo pierde el foco dentro de los modales

## Fecha
2026-11-05

## Problema
Al escribir en un campo de un modal de la billetera, el foco se sale del campo. El usuario tiene que volver a tocarlo para seguir escribiendo.

El efecto de `Modal` que mueve el foco a la ventana dependía de `onClose`. Los modales pasan una función nueva en cada render, así que cualquier redibujado volvía a ejecutar el efecto y le sacaba el foco al campo.

## Solución propuesta
- El foco y el bloqueo del scroll se aplican solo al abrir y al cerrar el modal.
- Escape se maneja en un efecto aparte, que depende de `isOpen` y `closeOnEscape`.
- `onClose` se guarda en un ref, para que Escape siempre llame a la última función sin volver a ejecutar los efectos.

## Archivos afectados
- `latin-zumi-react/src/components/ui/Modal.tsx`
- `latin-zumi-react/tests/components/ui/Modal.test.tsx`

## Pasos
1. Agregar tests que escriban en un campo dentro del modal.
2. Separar los efectos de `Modal`.

## Cómo probar
- [x] Los tests nuevos fallan sin el cambio y pasan con él.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Con `VITE_USE_MOCK=true`: escribir tecla por tecla en Depositar, Transferir y Cambiar sin perder el foco.
- [x] Con `VITE_USE_MOCK=true`: Escape cierra el modal y el foco vuelve al botón que lo abrió.
- [ ] En producción: repetir la prueba en Depositar, Transferir y Cambiar.

## Riesgos / notas
- `Modal` lo usan todos los diálogos de la app, incluido el de confirmación del panel de admin. El comportamiento al abrir y al cerrar no cambia.
- En modo mock, sin este cambio, la falla se reproduce en Transferir pero no en Depositar, cuyo campo no redibuja el modal. También se reportó en Depositar: hay que confirmarlo en producción.
