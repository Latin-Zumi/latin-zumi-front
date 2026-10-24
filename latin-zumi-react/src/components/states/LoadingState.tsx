import type { ReactNode } from "react";
import Spinner, { type SpinnerSize } from "../ui/Spinner";

type LoadingStateProps = {
  message?: string;
  skeleton?: ReactNode;
  size?: SpinnerSize;
  inline?: boolean;
};

export function LoadingState({ message = "Cargando...", skeleton, size = "md", inline = false }: LoadingStateProps) {
  return (
    <div className={`loading-state${inline ? " loading-state--inline" : ""}`} role="status" aria-live="polite">
      {skeleton ?? <Spinner size={size} label={message} />}
      {!inline && <span>{message}</span>}
    </div>
  );
}