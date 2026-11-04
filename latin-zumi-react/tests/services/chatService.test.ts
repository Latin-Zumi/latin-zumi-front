import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_URL,
  fetchCall,
  jsonResponse,
  loadWithEnv,
  mockFetch,
  mockFetchNetworkError,
  storeSession,
  TEST_SESSION,
} from '../helpers/api';

type ChatService = typeof import('../../src/services/chatService');
const load = (useMock: boolean) => loadWithEnv(useMock, () => import('../../src/services/chatService'));

const REPLY = { message: 'Tenés 10 USD.', conversationId: 'conversacion-1', suggestions: ['¿Y en euros?'] };

describe('chatService con la API real', () => {
  let service: ChatService;

  beforeEach(async () => {
    service = await load(false);
    storeSession();
  });

  it('sin sesión falla con UNAUTHORIZED, sin llamar al backend', async () => {
    localStorage.clear();
    const fetchMock = mockFetch();

    await expect(service.sendChatMessage({ message: 'Hola' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('manda el token y saca la respuesta de data', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { data: REPLY }));

    await expect(service.sendChatMessage({ message: 'Hola' })).resolves.toEqual(REPLY);

    const call = fetchCall(fetchMock);
    expect(call.url).toBe(`${API_URL}/chat/messages`);
    expect(call.method).toBe('POST');
    expect(call.headers.get('Authorization')).toBe(`Bearer ${TEST_SESSION.token}`);
    // Sin conversación ni historial, esos campos no se mandan
    expect(call.body).toEqual({ message: 'Hola' });
  });

  it('manda solo los últimos 10 mensajes y recorta los que superan el límite', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { data: REPLY }));
    const history = Array.from({ length: 12 }, (_, index) => ({
      role: 'user' as const,
      content: `Mensaje ${index}`,
    }));
    history[11] = { role: 'user', content: 'a'.repeat(2500) };

    await service.sendChatMessage({ message: 'Hola', conversationId: 'conversacion-1', history });

    const { body } = fetchCall(fetchMock);
    expect(body.conversationId).toBe('conversacion-1');
    expect(body.history).toHaveLength(10);
    expect(body.history[0].content).toBe('Mensaje 2');
    expect(body.history[9].content).toHaveLength(2000);
  });

  it.each([
    [401, 'UNAUTHORIZED'],
    [429, 'TOO_MANY_REQUESTS'],
    [503, 'UNAVAILABLE'],
    [400, 'UNKNOWN'],
    [500, 'UNKNOWN'],
  ])('con status %i falla con %s', async (status, code) => {
    mockFetch(jsonResponse(status, { code: 'X', message: 'detalle interno' }));

    const error = await service.sendChatMessage({ message: 'Hola' }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(service.ChatError);
    expect(error).toMatchObject({ code });
    // No muestra el mensaje del back: el 503 puede traer el error del proveedor de IA
    expect((error as Error).message).not.toContain('detalle interno');
  });

  it('sin conexión falla con CONNECTION', async () => {
    mockFetchNetworkError();

    await expect(service.sendChatMessage({ message: 'Hola' })).rejects.toMatchObject({ code: 'CONNECTION' });
  });
});

describe('chatService en modo mock', () => {
  let service: ChatService;

  beforeEach(async () => {
    service = await load(true);
    storeSession();
    vi.useFakeTimers();
  });

  it('responde con los saldos sin llamar al backend y conserva la conversación', async () => {
    const fetchMock = mockFetch();

    const pending = service.sendChatMessage({ message: '¿Cuánto tengo?', conversationId: 'conversacion-1' });
    await vi.advanceTimersByTimeAsync(400);
    const reply = await pending;

    expect(reply.conversationId).toBe('conversacion-1');
    expect(reply.message).toContain('USD');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
