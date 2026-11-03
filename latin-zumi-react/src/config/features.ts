// Funciones que dependen de que el backend las tenga listas.
// Los componentes se conservan; solo se ocultan mientras estén apagadas.

// POST /auth/google ya existe, pero el CORS del back todavía no permite PATCH /users/me
export const GOOGLE_AUTH_ENABLED = false;

// /wallet/transactions, /transfers, /deposits y /exchanges
export const TRANSACTIONS_ENABLED = true;

// /admin/* solo existe en el mock: ver docs/specs/2026-11-03-Panel-admin-backend.md
export const ADMIN_ENABLED = import.meta.env.VITE_USE_MOCK === 'true';
