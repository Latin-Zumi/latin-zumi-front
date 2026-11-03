// Funciones que dependen de que el backend las tenga listas.
// Los componentes se conservan; solo se ocultan mientras estén apagadas.

// POST /auth/google ya existe, pero el CORS del back todavía no permite PATCH /users/me
export const GOOGLE_AUTH_ENABLED = false;

// /wallet/transactions, /transfers, /deposits y /exchanges
export const TRANSACTIONS_ENABLED = true;

// Prender cuando Render tenga /admin/* y Neon las migraciones 012 y 013:
// ver docs/specs/2026-11-03-Alinear-admin-con-el-back.md
export const ADMIN_ENABLED = import.meta.env.VITE_USE_MOCK === 'true';
