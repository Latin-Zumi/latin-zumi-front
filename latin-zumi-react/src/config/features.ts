// Funciones que dependen de que el backend las tenga listas.
// Los componentes se conservan; solo se ocultan mientras estén apagadas.

// Requiere POST /auth/google y PATCH /users/me; el flujo sigue apagado hasta confirmar
// que el backend desplegado y su CORS permiten completar el perfil.
export const GOOGLE_AUTH_ENABLED = false;

// La interfaz está habilitada; los servicios usan mock con VITE_USE_MOCK=true y API real en caso contrario.
export const TRANSACTIONS_ENABLED = true;

// Por ahora el panel solo se habilita en modo mock. Habilitarlo con API real requiere
// confirmar el despliegue de /admin/* y las migraciones 012 y 013:
// ver docs/specs/2026-11-03-Alinear-admin-con-el-back.md
export const ADMIN_ENABLED = import.meta.env.VITE_USE_MOCK === 'true';
