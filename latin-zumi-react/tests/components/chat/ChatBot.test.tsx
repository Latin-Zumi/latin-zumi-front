import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatBot from '../../../src/components/chat/ChatBot';
import { useAuth } from '../../../src/context/auth';
import { ChatError, sendChatMessage } from '../../../src/services/chatService';

vi.mock('../../../src/config/features', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/config/features')>()),
  CHATBOT_ENABLED: true,
}));

vi.mock('../../../src/context/auth', () => ({ useAuth: vi.fn() }));

// Solo se reemplaza el pedido; ChatError es la real
vi.mock('../../../src/services/chatService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/chatService')>()),
  sendChatMessage: vi.fn(),
}));

const sendMock = vi.mocked(sendChatMessage);
const logout = vi.fn().mockResolvedValue(undefined);

function mockAuth(overrides: { id?: string; passwordChangeRequired?: boolean; noUser?: boolean } = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: overrides.noUser ? null : { id: overrides.id ?? 'usuario-1', nombre: 'Vale' },
    passwordChangeRequired: overrides.passwordChangeRequired ?? false,
    logout,
  } as unknown as ReturnType<typeof useAuth>);
}

async function openChat() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Abrir el asistente' }));
  return user;
}

describe('ChatBot', () => {
  beforeEach(() => {
    logout.mockClear();
    sendMock.mockReset();
    sendMock.mockResolvedValue({ message: 'Tenés 10 USD.', conversationId: 'conversacion-1', suggestions: ['¿Y en euros?'] });
    mockAuth();
  });

  it('no aparece sin sesión', () => {
    mockAuth({ noUser: true });
    render(<ChatBot />);

    expect(screen.queryByRole('button', { name: 'Abrir el asistente' })).not.toBeInTheDocument();
  });

  it('no aparece si el back pide cambiar la contraseña', () => {
    mockAuth({ passwordChangeRequired: true });
    render(<ChatBot />);

    expect(screen.queryByRole('button', { name: 'Abrir el asistente' })).not.toBeInTheDocument();
  });

  it('se abre con el foco en el mensaje y se cierra con Escape', async () => {
    render(<ChatBot />);
    const user = await openChat();

    expect(screen.getByRole('dialog', { name: 'Asistente de Latin Zumi' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tu mensaje')).toHaveFocus();

    await user.keyboard('{Escape}');

    const open = screen.getByRole('button', { name: 'Abrir el asistente' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(open).toHaveFocus());
  });

  it('envía con Enter y muestra la respuesta y sus sugerencias', async () => {
    render(<ChatBot />);
    const user = await openChat();

    await user.type(screen.getByLabelText('Tu mensaje'), 'Hola{Enter}');

    expect(await screen.findByText('Tenés 10 USD.')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '¿Y en euros?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tu mensaje')).toHaveValue('');
    expect(sendMock).toHaveBeenCalledWith({ message: 'Hola', conversationId: undefined, history: [] });
  });

  it('Shift+Enter baja de línea sin enviar', async () => {
    render(<ChatBot />);
    const user = await openChat();

    await user.type(screen.getByLabelText('Tu mensaje'), 'Hola{Shift>}{Enter}{/Shift}');

    expect(sendMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Tu mensaje')).toHaveValue('Hola\n');
  });

  it('no envía un mensaje vacío', async () => {
    render(<ChatBot />);
    const user = await openChat();

    await user.type(screen.getByLabelText('Tu mensaje'), '   {Enter}');

    expect(sendMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('una sugerencia envía el mensaje, y el siguiente lleva conversación e historial', async () => {
    render(<ChatBot />);
    const user = await openChat();

    await user.click(screen.getByRole('button', { name: '¿Cuánto tengo en mi billetera?' }));
    await screen.findByText('Tenés 10 USD.');
    await user.type(screen.getByLabelText('Tu mensaje'), 'Gracias{Enter}');

    await waitFor(() => expect(sendMock).toHaveBeenCalledTimes(2));
    expect(sendMock).toHaveBeenLastCalledWith({
      message: 'Gracias',
      conversationId: 'conversacion-1',
      history: [
        { role: 'user', content: '¿Cuánto tengo en mi billetera?' },
        { role: 'assistant', content: 'Tenés 10 USD.' },
      ],
    });
  });

  it('si falla, muestra el error y devuelve el mensaje al campo', async () => {
    sendMock.mockRejectedValueOnce(new ChatError('UNAVAILABLE'));
    render(<ChatBot />);
    const user = await openChat();

    await user.type(screen.getByLabelText('Tu mensaje'), 'Hola{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('El asistente no está disponible');
    expect(screen.getByLabelText('Tu mensaje')).toHaveValue('Hola');
    expect(within(screen.getByRole('log')).queryByText('Hola')).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('cierra la sesión si el back responde que venció', async () => {
    sendMock.mockRejectedValueOnce(new ChatError('UNAUTHORIZED'));
    render(<ChatBot />);
    const user = await openChat();

    await user.type(screen.getByLabelText('Tu mensaje'), 'Hola{Enter}');

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it('muestra el HTML de una respuesta como texto', async () => {
    sendMock.mockResolvedValueOnce({ message: '<img src=x onerror=alert(1)>', conversationId: 'c', suggestions: [] });
    render(<ChatBot />);
    const user = await openChat();

    await user.type(screen.getByLabelText('Tu mensaje'), 'Hola{Enter}');

    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('al cambiar de usuario, la conversación se borra', async () => {
    const { rerender } = render(<ChatBot />);
    const user = await openChat();
    await user.type(screen.getByLabelText('Tu mensaje'), 'Hola{Enter}');
    await screen.findByText('Tenés 10 USD.');

    mockAuth({ id: 'usuario-2' });
    rerender(<ChatBot />);
    await user.click(screen.getByRole('button', { name: 'Abrir el asistente' }));

    expect(screen.queryByText('Tenés 10 USD.')).not.toBeInTheDocument();
  });
});
