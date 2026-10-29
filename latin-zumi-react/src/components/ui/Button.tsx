import type React from 'react';
import Spinner from "./Spinner.tsx";

type ButtonBaseProps = {
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
};

type SolidButtonProps = ButtonBaseProps & {
  variant: 'solid';
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  form?: string;
  // Botón secundario: solo borde, sin relleno
  outline?: boolean;
};

type LinkButtonProps = ButtonBaseProps & {
  variant: 'link';
  href: string;
  target?: '_self' | '_blank' | string;
};

type ButtonProps = SolidButtonProps | LinkButtonProps;

export const Button: React.FC<ButtonProps> = (props) => {
  const { size = 'md', children } = props;

  if (props.variant === 'solid') {
    const { type = 'button', onClick, disabled, loading, form, outline } = props;
    const isDisabled = disabled || loading;

    return (
      <button
        type={type}
        aria-busy={loading || undefined}
        className={`btn btn-${size}${outline ? ' btn-outline' : ''}`}
        form={form}
        onClick={onClick}
        disabled={isDisabled}
      >
        {loading ? <><Spinner size="sm" /> Cargando…</> : children}
      </button>
    );
  }

  if (props.variant === 'link') {
    const { href, target } = props;
    return (
      <a
        className={`btn-link btn-${size}`}
        href={href}
        target={target}
      >
        {children}
      </a>
    );
  }

  return null;
};

export default Button;