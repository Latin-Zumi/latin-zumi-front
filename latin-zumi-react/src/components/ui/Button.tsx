import type React from 'react';
import Spinner from "./Spinner.tsx";

type ButtonBaseProps = {
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
};

type SolidButtonProps = ButtonBaseProps & {
  variant: 'solid';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
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
    const { onClick, disabled, loading } = props;
    const isDisabled = disabled || loading;

    return (
      <button
        className={`btn btn-${size}`}
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