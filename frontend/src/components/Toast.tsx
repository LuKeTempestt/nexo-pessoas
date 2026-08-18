import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { Button } from "./Button";

export type ToastState = {
  type: "success" | "error";
  text: string;
};

type ToastProps = {
  toast: ToastState | null;
  onClose: () => void;
};

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  return (
    <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
      {toast.type === "success"
        ? <CheckCircle2 size={20} aria-hidden="true" />
        : <CircleAlert size={20} aria-hidden="true" />}
      <span>{toast.text}</span>
      <Button variant="icon" type="button" aria-label="Fechar mensagem" onClick={onClose}>
        <X size={17} aria-hidden="true" />
      </Button>
    </div>
  );
}
