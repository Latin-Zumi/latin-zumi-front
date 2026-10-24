# Spec: EmptyState para la billetera

## Fecha
2026-10-24

## Problema
Cuando el usuario no tiene transacciones o fondos en su billetera, necesita un mensaje claro y accesible que explique el estado y, cuando corresponda, le indique una acción posible.

## Solución propuesta
Implementar un componente `EmptyState` configurable:
- Aceptar `title` como título principal y `description` como descripción opcional.
- Aceptar `actionLabel` y `onAction` para mostrar una acción, por ejemplo, navegar a la opción de depósito.
- Aceptar las variantes `no-transactions` y `no-balance`.
- Mostrar un mensaje contextual según la variante.
- Usar `role="status"` y `aria-live="polite"` para anunciar el estado a lectores de pantalla.

## Archivos afectados
- `src/components/states/Empystate.tsx`
- `tests/EmptyState.test.tsx`

## Pasos
1. Definir las props del componente para el título, la descripción, la acción y la variante.
2. Implementar los mensajes para las variantes `no-transactions` y `no-balance`.
3. Mostrar el botón de acción cuando se proporcionen `actionLabel` y `onAction`.
4. Añadir los atributos de accesibilidad `role="status"` y `aria-live="polite"`.
5. Exportar el componente.

## Cómo probar
- [ ] Usar la variante `no-transactions` y verificar que muestre “Todavía no realizaste ninguna transacción en tu billetera”.
- [ ] Usar la variante `no-balance` y verificar que muestre “No tenés fondos disponibles en tu billetera”.
- [ ] Proporcionar `actionLabel` y `onAction` y verificar que aparezca el botón de acción.
- [ ] Verificar que el contenedor tenga `role="status"` y `aria-live="polite"`.

## Riesgos / notas
- Los mensajes deben ser claros y concisos.
- La acción solo debe mostrarse cuando se proporcionen tanto `actionLabel` como `onAction`.
