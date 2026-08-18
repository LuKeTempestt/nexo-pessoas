import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import type { User } from "../types/user";
import { Button } from "./Button";

type ConfirmDialogProps = {
  user: User | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ user, busy, onCancel, onConfirm }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (user && !dialog.open) dialog.showModal();
    if (!user && dialog.open) dialog.close();
  }, [user]);

  return (
    <dialog
      ref={dialogRef}
      className="modal modal--compact"
      aria-labelledby="delete-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClose={onCancel}
    >
      <div className="modal__card">
        <div className="danger-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <h2 id="delete-title">Ocultar usuário?</h2>
        <p>
          O cadastro de <strong>{user?.nome}</strong> sairá da lista de ativos, mas
          continuará preservado e poderá ser restaurado.
        </p>
        <footer className="modal__footer">
          <Button type="button" disabled={busy} onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" type="button" disabled={busy} onClick={onConfirm}>
            {busy ? "Ocultando..." : "Ocultar usuário"}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
