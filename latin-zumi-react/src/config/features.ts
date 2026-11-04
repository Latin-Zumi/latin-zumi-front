// Funciones que dependen de que el backend las tenga listas.
// Los componentes se conservan; solo se ocultan mientras estén apagadas.

// Requiere POST /auth/google y PATCH /users/me; el flujo sigue apagado hasta confirmar
// que el backend desplegado y su CORS permiten completar el perfil.
export const GOOGLE_AUTH_ENABLED = false;

// La interfaz está habilitada; los servicios usan mock con VITE_USE_MOCK=true y API real en caso contrario.
export const TRANSACTIONS_ENABLED = true;

// Panel de admin: lo ven solo los usuarios con rol admin
export const ADMIN_ENABLED = true;
