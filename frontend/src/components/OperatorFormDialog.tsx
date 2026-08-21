import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import { operatorSchema } from "../lib/operatorSchema";
import type { OperatorInput } from "../types/user";
import { Button } from "./Button";

type OperatorFormDialogProps = {
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: OperatorInput) => void;
};

export function OperatorFormDialog({ busy, onClose, onSubmit }: OperatorFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<OperatorInput>({
    resolver: zodResolver(operatorSchema),
    defaultValues: { nome: "", email: "", password: "", role: "OPERADOR" }
  });

  useEffect(() => {
    reset({ nome: "", email: "", password: "", role: "OPERADOR" });
    dialogRef.current?.showModal();
  }, [reset]);

  return (
    <dialog
      ref={dialogRef}
      className="modal access-dialog"
      aria-labelledby="operator-dialog-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClose={onClose}
    >
      <section className="modal__card">
        <header className="modal__header"><div><span className="page-kicker">Equipe e acessos</span><h2 id="operator-dialog-title">Nova conta</h2></div></header>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">
            <label className="field field--wide">Nome<input autoComplete="name" {...register("nome")} />{errors.nome && <small>{errors.nome.message}</small>}</label>
            <label className="field field--wide">E-mail<input type="email" autoComplete="username" {...register("email")} />{errors.email && <small>{errors.email.message}</small>}</label>
            <label className="field">Senha inicial<input type="password" autoComplete="new-password" {...register("password")} />{errors.password && <small>{errors.password.message}</small>}</label>
            <label className="field">Perfil<select {...register("role")}><option value="ADMIN">Administrador</option><option value="OPERADOR">Operador</option><option value="AUDITOR">Auditor</option></select></label>
          </div>
          <p className="form-note">Cada pessoa deve usar sua própria conta. A senha não é armazenada em texto puro.</p>
          <footer className="modal__footer"><Button type="button" onClick={onClose} disabled={busy}>Cancelar</Button><Button variant="primary" type="submit" disabled={busy}>{busy ? "Criando..." : "Criar conta"}</Button></footer>
        </form>
      </section>
    </dialog>
  );
}
