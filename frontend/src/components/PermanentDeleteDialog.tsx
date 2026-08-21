import { AlertOctagon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { User } from "../types/user";
import { Button } from "./Button";

type Props = { readonly user: User; readonly busy: boolean; readonly onCancel: () => void; readonly onConfirm: () => void };

export function PermanentDeleteDialog({ user, busy, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="modal modal--compact" aria-labelledby="permanent-delete-title" onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }} onClose={onCancel}>
      <div className="modal__card">
        <div className="danger-icon"><AlertOctagon size={22} /></div>
        <h2 id="permanent-delete-title">Apagar definitivamente?</h2>
        <p><strong>{user.nome}</strong> será removido do banco. Esta ação não pode ser desfeita.</p>
        <label className="danger-confirm">Digite <strong>EXCLUIR</strong><input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>
        <footer className="modal__footer">
          <Button type="button" disabled={busy} onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" type="button" disabled={busy || confirmation !== "EXCLUIR"} onClick={onConfirm}>{busy ? "Apagando..." : "Apagar definitivamente"}</Button>
        </footer>
      </div>
    </dialog>
  );
}
