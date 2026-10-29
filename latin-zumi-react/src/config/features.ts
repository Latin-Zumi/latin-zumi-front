// Funciones que dependen de endpoints que el backend todavía no tiene.
// Los componentes se conservan; solo se ocultan mientras estén apagadas.

// POST /auth/google y PATCH /users/me no existen en el mínimo funcional
export const GOOGLE_AUTH_ENABLED = false;

// /wallet/transactions, /transfers, /deposits y /exchanges solo existen en el mock
export const TRANSACTIONS_ENABLED = import.meta.env.VITE_USE_MOCK === 'true';
