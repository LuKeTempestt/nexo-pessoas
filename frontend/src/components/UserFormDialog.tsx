import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { formatCpf, formatPhone, onlyDigits } from "../lib/formatters";
import { userSchema, type UserFormValues } from "../lib/userSchema";
import type { User, UserInput } from "../types/user";
import { Button } from "./Button";

type UserFormDialogProps = {
  open: boolean;
  user: User | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (data: UserInput) => void;
};

const emptyValues: UserFormValues = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  dataNascimento: ""
};

export function UserFormDialog({
  open,
  user,
  busy,
  onClose,
  onSubmit
}: UserFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: emptyValues
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    reset(user ? {
      nome: user.nome,
      email: user.email,
      cpf: formatCpf(user.cpf),
      telefone: formatPhone(user.telefone),
      dataNascimento: user.dataNascimento.slice(0, 10)
    } : emptyValues);
  }, [reset, user, open]);

  function submit(values: UserFormValues) {
    onSubmit({
      ...values,
      nome: values.nome.trim(),
      email: values.email.trim().toLocaleLowerCase("pt-BR"),
      cpf: onlyDigits(values.cpf),
      telefone: onlyDigits(values.telefone)
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="form-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClose={onClose}
    >
      <div className="modal__card">
        <header className="modal__header">
          <div>
            <span className="modal__kicker">
              {user ? `Registro #${user.id}` : "Novo cadastro"}
            </span>
            <h2 id="form-title">
              {user ? "Editar usuário" : "Cadastrar usuário"}
            </h2>
          </div>
          <Button
            variant="icon"
            type="button"
            aria-label="Fechar formulário"
            disabled={busy}
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </header>

        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="form-grid">
            <div className="field field--wide">
              <label htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                autoFocus
                autoComplete="name"
                aria-invalid={Boolean(errors.nome)}
                {...register("nome")}
              />
              <small className={errors.nome ? "field__error" : ""}>
                {errors.nome?.message ?? "Use entre 3 e 120 caracteres."}
              </small>
            </div>

            <div className="field field--wide">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? <small className="field__error">{errors.email.message}</small> : null}
            </div>

            <div className="field">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                maxLength={14}
                aria-invalid={Boolean(errors.cpf)}
                {...register("cpf", {
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    setValue("cpf", formatCpf(event.target.value), { shouldValidate: false });
                  }
                })}
              />
              {errors.cpf ? <small className="field__error">{errors.cpf.message}</small> : null}
            </div>

            <div className="field">
              <label htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                maxLength={15}
                aria-invalid={Boolean(errors.telefone)}
                {...register("telefone", {
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    setValue("telefone", formatPhone(event.target.value), { shouldValidate: false });
                  }
                })}
              />
              {errors.telefone ? <small className="field__error">{errors.telefone.message}</small> : null}
            </div>

            <div className="field field--wide">
              <label htmlFor="dataNascimento">Data de nascimento</label>
              <input
                id="dataNascimento"
                type="date"
                aria-invalid={Boolean(errors.dataNascimento)}
                {...register("dataNascimento")}
              />
              {errors.dataNascimento ? (
                <small className="field__error">{errors.dataNascimento.message}</small>
              ) : null}
            </div>
          </div>

          <footer className="modal__footer">
            <Button type="button" disabled={busy} onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? "Salvando..." : user ? "Salvar alterações" : "Cadastrar usuário"}
            </Button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
