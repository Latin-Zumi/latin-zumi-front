# Spec: LoadingState para la billetera

# Fecha
2026-10-24

# Problema
Cuando el usuario espera la carga de datos en la billetera (ej. balances, historial de transacciones), necesita un indicador claro y accesible que muestre que la operación está en progreso.

# Solución propuesta
Implementar un componente LoadingState configurable:

Aceptar message como texto opcional para mostrar el estado de carga.

Aceptar skeleton como contenido opcional para mostrar estructura de la UI mientras se cargan los datos.

Aceptar size para controlar el tamaño del Spinner.

Aceptar inline para renderizar el mensaje en línea o en bloque.

Usar role="status" y aria-live="polite" para accesibilidad.

# Archivos afectados
src/components/states/LoadingState.tsx

tests/LoadingState.test.tsx

# Pasos
Definir las props del componente (message, skeleton, size, inline).

Renderizar Spinner con label accesible si no se pasa skeleton.

Mostrar el mensaje en bloque o inline según la prop inline.

Añadir atributos de accesibilidad role="status" y aria-live="polite".

Exportar el componente.

# Cómo probar
[ ] Renderizar LoadingState sin props → debe mostrar Spinner tamaño md y mensaje “Cargando…”.

[ ] Renderizar con skeleton → debe mostrar el skeleton en lugar del Spinner.

[ ] Renderizar con inline={true} → debe mostrar el mensaje en línea junto al Spinner.

[ ] Verificar que el contenedor tenga role="status" y aria-live="polite".

# Riesgos / notas
El mensaje debe ser claro y conciso.

El Spinner solo debe mostrarse cuando no se pasa skeleton.

Puede extenderse en el futuro con variantes de color o animación.