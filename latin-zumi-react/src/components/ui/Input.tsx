import { useId, type ComponentProps } from "react";

type InputProps = Omit<ComponentProps<"input">, "type"> & {
  label?: string;
  type?: "text" | "email" | "password" | "number";
  error?: string;
};

export const Input = ({
  label,
  type = "text",
  error,
  id,
  className,
  ...rest
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

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
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} className="input-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;