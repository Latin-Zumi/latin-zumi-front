import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  // onClose suele ser una función nueva en cada render: no puede volver a disparar los efectos
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Solo al abrir y al cerrar: si corriera en cada render, le sacaría el foco al campo donde se escribe
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <header className="dialog-header">
          {title && <h2 id={titleId}>{title}</h2>}
          <button type="button" className="dialog-close" aria-label="Cerrar diálogo" onClick={onClose}>×</button>
        </header>
        <div className="dialog-body">{children}</div>
        <footer className="dialog-footer">
          {footer ?? <Button variant="solid" onClick={onClose}>Cerrar</Button>}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

export default Modal;