// Funciones que dependen de que el backend las tenga listas.
// Los componentes se conservan; solo se ocultan mientras estén apagadas.

// Se prende con VITE_GOOGLE_AUTH_ENABLED=true. Requiere las variables de Firebase en el
// front y en el back: ver docs/specs/2026-11-05-Prender-chat-y-google.md
export const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

// La interfaz está habilitada; los servicios usan mock con VITE_USE_MOCK=true y API real en caso contrario.
export const TRANSACTIONS_ENABLED = true;

// Panel de admin: lo ven solo los usuarios con rol admin
export const ADMIN_ENABLED = true;

// Se prende con VITE_CHATBOT_ENABLED=true; en modo mock siempre está disponible.
// Requiere GEMINI_API_KEY en el back: ver docs/specs/2026-11-05-Prender-chat-y-google.md
export const CHATBOT_ENABLED =
  import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_CHATBOT_ENABLED === 'true';
