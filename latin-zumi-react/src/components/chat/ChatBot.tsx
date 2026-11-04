import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { CHATBOT_ENABLED } from '../../config/features';
import { useAuth } from '../../context/auth';
import {
  CHAT_MESSAGE_MAX_LENGTH,
  ChatError,
  sendChatMessage,
  type ChatMessage,
} from '../../services/chatService';
import Button from '../ui/Button';

const INITIAL_SUGGESTIONS = ['¿Cuánto tengo en mi billetera?', '¿Cuál fue mi último movimiento?'];

function ChatWindow({ nombre }: { nombre: string }) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [conversationId, setConversationId] = useState<string>();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, isSending, error, isOpen]);

  function close() {
    setIsOpen(false);
    // El botón vuelve a aparecer después de este render
    setTimeout(() => openButtonRef.current?.focus());
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);
    setError('');
    setDraft('');
    setSuggestions([]);
    setMessages([...messages, { role: 'user', content: message }]);

    try {
      const reply = await sendChatMessage({ message, conversationId, history: messages });
      setMessages((current) => [...current, { role: 'assistant', content: reply.message }]);
      setConversationId(reply.conversationId);
      setSuggestions(reply.suggestions);
    } catch (caught) {
      // El mensaje vuelve al campo para poder reenviarlo, sin quedar repetido en el historial
      setMessages(messages);
      setDraft(message);
      setError(caught instanceof Error ? caught.message : 'No pudimos responder tu mensaje. Probá de nuevo.');
      // Token vencido o revocado: sin sesión, se cierra el chat
      if (caught instanceof ChatError && caught.code === 'UNAUTHORIZED') void logout();
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  // Enter envía y Shift+Enter baja de línea, salvo mientras se compone un acento o un emoji
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  }

  if (!isOpen) {
    return (
      <button
        ref={openButtonRef}
        type="button"
        className="chatbot__open"
        aria-label="Abrir el asistente"
        onClick={() => setIsOpen(true)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-8 8H4l2.5-3A8 8 0 1 1 21 12Z" />
        </svg>
      </button>
    );
  }

  return (
    <section
      className="chatbot__panel"
      role="dialog"
      aria-labelledby="chatbot-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
    >
      <header className="chatbot__header">
        <h2 id="chatbot-title">Asistente de Latin Zumi</h2>
        <button type="button" className="dialog-close" aria-label="Cerrar el asistente" onClick={close}>
          ×
        </button>
      </header>

      <div ref={logRef} className="chatbot__log" role="log" aria-live="polite">
        <p className="chatbot__message chatbot__message--assistant">
          Hola, {nombre}. Puedo ayudarte con tus saldos y tus movimientos.
        </p>
        {messages.map((message, index) => (
          <p key={index} className={`chatbot__message chatbot__message--${message.role}`}>
            {message.content}
          </p>
        ))}
        {isSending && (
          <p className="chatbot__message chatbot__message--assistant chatbot__typing">Escribiendo…</p>
        )}
      </div>

      {suggestions.length > 0 && !isSending && (
        <div className="chatbot__suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chatbot__suggestion"
              onClick={() => void send(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="form-error chatbot__error" role="alert">
          {error}
        </p>
      )}

      <form className="chatbot__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chatbot-input">
          Tu mensaje
        </label>
        <textarea
          ref={inputRef}
          id="chatbot-input"
          rows={2}
          placeholder="Escribí tu pregunta"
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="solid" size="sm" type="submit" disabled={!draft.trim()} loading={isSending}>
          Enviar
        </Button>
      </form>
      <p className="chatbot__note">
        Responde con inteligencia artificial, usando tus saldos y movimientos. Puede equivocarse: no
        hace operaciones.
      </p>
    </section>
  );
}

// Solo con sesión, porque el back exige token. Al cambiar de usuario, la conversación se borra.
export default function ChatBot() {
  const { user, passwordChangeRequired } = useAuth();

  if (!CHATBOT_ENABLED || !user || passwordChangeRequired) return null;
  return <ChatWindow key={user.id} nombre={user.nombre} />;
}
