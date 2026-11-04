import { getMockChatReply } from '../mocks/chat';
import { ApiConnectionError, apiRequest } from './apiClient';
import { getSession } from './authService';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Límites de POST /chat/messages
export const CHAT_MESSAGE_MAX_LENGTH = 2000;
const CHAT_HISTORY_LIMIT = 10;

export type ChatErrorCode =
  | 'UNAUTHORIZED'
  | 'TOO_MANY_REQUESTS'
  | 'UNAVAILABLE'
  | 'CONNECTION'
  | 'UNKNOWN';

// Mensajes propios: el 503 del back puede traer el error interno del proveedor de IA
const ERROR_MESSAGES: Record<ChatErrorCode, string> = {
  UNAUTHORIZED: 'Tu sesión expiró. Volvé a iniciar sesión.',
  TOO_MANY_REQUESTS: 'Demasiados mensajes. Esperá unos minutos.',
  UNAVAILABLE: 'El asistente no está disponible en este momento. Probá más tarde.',
  CONNECTION: 'No pudimos conectar con el servidor. Probá de nuevo.',
  UNKNOWN: 'No pudimos responder tu mensaje. Probá de nuevo.',
};

export class ChatError extends Error {
  code: ChatErrorCode;

  constructor(code: ChatErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.code = code;
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  history?: ChatMessage[];
}

export interface ChatReply {
  message: string;
  conversationId: string;
  suggestions: string[];
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function codeForStatus(status: number): ChatErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 429) return 'TOO_MANY_REQUESTS';
  if (status === 503) return 'UNAVAILABLE';
  return 'UNKNOWN';
}

// El back no guarda la conversación: en cada mensaje recibe los últimos, con su límite de largo.
// Una respuesta larga del asistente se recorta para que no rechace todo el pedido.
function toHistory(history: ChatMessage[]): ChatMessage[] {
  return history.slice(-CHAT_HISTORY_LIMIT).map(({ role, content }) => ({
    role,
    content: content.slice(0, CHAT_MESSAGE_MAX_LENGTH),
  }));
}

export async function sendChatMessage({
  message,
  conversationId,
  history = [],
}: ChatRequest): Promise<ChatReply> {
  const session = getSession();
  if (!session) throw new ChatError('UNAUTHORIZED');

  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    return {
      message: getMockChatReply(session.user.email, message),
      conversationId: conversationId ?? crypto.randomUUID(),
      suggestions: ['¿Cuánto tengo en mi billetera?'],
    };
  }

  let response: Response;
  try {
    response = await apiRequest('/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        message,
        ...(conversationId && { conversationId }),
        ...(history.length > 0 && { history: toHistory(history) }),
      }),
    });
  } catch (error) {
    if (error instanceof ApiConnectionError) throw new ChatError('CONNECTION');
    throw error;
  }

  if (!response.ok) throw new ChatError(codeForStatus(response.status));

  const { data } = (await response.json()) as { data: ChatReply };
  return data;
}
