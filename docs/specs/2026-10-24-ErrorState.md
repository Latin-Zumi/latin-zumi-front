# Spec: ErrorState para la billetera
Fecha
2026-10-24

Problema
Cuando ocurre un error en la billetera (ej. fallo al cargar transacciones, error de conexión con el servicio de pagos), el usuario necesita un mensaje claro y accesible que explique el problema y, cuando corresponda, le permita reintentar la acción.

Solución propuesta
Implementar un componente ErrorState configurable:

Aceptar message como texto obligatorio para mostrar el error.

Aceptar onRetry como callback opcional para mostrar un botón de reintento.

Usar role="alert" para que los lectores de pantalla anuncien el error inmediatamente.

Mostrar un mensaje contextual con prefijo “Error en la billetera”.

Archivos afectados
src/components/states/ErrorState.tsx

tests/ErrorState.test.tsx

Pasos
Definir las props del componente (message, onRetry).

Renderizar el mensaje de error dentro de un contenedor con role="alert".

Mostrar el botón de reintento solo si se proporciona onRetry.

Exportar el componente.

Cómo probar
[ ] Renderizar ErrorState con message="No se pudo cargar el balance" y verificar que muestre el texto.

[ ] Renderizar ErrorState con onRetry y verificar que aparezca el botón “Reintentar”.

[ ] Verificar que el contenedor tenga role="alert".

[ ] Simular clic en el botón y confirmar que se ejecuta el callback onRetry.

Riesgos / notas
El mensaje debe ser claro y conciso.

El botón de reintento solo debe mostrarse si se pasa onRetry.

Puede extenderse en el futuro con variantes de error (ej. red, permisos).