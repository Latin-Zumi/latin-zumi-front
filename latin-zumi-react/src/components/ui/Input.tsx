import { useId, type ComponentProps } from "react";

type InputProps = Omit<ComponentProps<"input">, "type"> & {
  label?: string;
  type?: "text" | "email" | "password" | "number";
  error?: string;
  notice?: string;
};

export const Input = ({
  label,
  type = "text",
  error,
  notice,
  id,
  className,
  ...rest
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const noticeId = `${inputId}-notice`;
  const describedBy = [
    rest['aria-describedby'],
    error ? errorId : undefined,
    notice ? noticeId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="input-container">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={inputId}
        type={type}
        className={`input-field${error ? " input-field--error" : ""}${className ? ` ${className}` : ""}`}
        aria-invalid={!!error}
        aria-describedby={describedBy}
      />
      {error && (
        <span id={errorId} className="input-error" role="alert">
          {error}
        </span>
      )}
      {notice && (
        <span id={noticeId} className="form-notice" role="status" aria-live="polite">
          {notice}
        </span>
      )}
    </div>
  );
};

export default Input;