import { useEffect, useRef, useState, type FormEvent } from "react";

import type { Operator } from "../types/user";
import { Button } from "./Button";

type PasswordResetDialogProps = {
  readonly operator: Operator;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (password: string) => void;
};

export function PasswordResetDialog({ operator, busy, onClose, onSubmit }: PasswordResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  const invalid = password.length < 12 || password !== confirmation;
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!invalid) onSubmit(password); }
  return (
    <dialog
      ref={dialogRef}
      className="modal access-dialog"
      aria-labelledby="password-dialog-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClose={onClose}
    >
      <section className="modal__card">
        <header className="modal__header"><div><span className="page-kicker">Segurança</span><h2 id="password-dialog-title">Redefinir senha</h2><p>{operator.nome}</p></div></header>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field field--wide">Nova senha<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /><small>Use pelo menos 12 caracteres.</small></label>
            <label className="field field--wide">Confirmar nova senha<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />{confirmation && password !== confirmation ? <small>As senhas precisam ser iguais.</small> : null}</label>
          </div>
          <p className="form-note">Ao salvar, todas as sessões dessa conta serão encerradas.</p>
          <footer className="modal__footer"><Button type="button" onClick={onClose} disabled={busy}>Cancelar</Button><Button variant="primary" type="submit" disabled={busy || invalid}>{busy ? "Salvando..." : "Redefinir senha"}</Button></footer>
        </form>
      </section>
    </dialog>
  );
}
