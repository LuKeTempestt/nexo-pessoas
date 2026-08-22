import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { firstAdministratorSchema } from "../lib/operatorSchema";
import { Button } from "./Button";

type SetupForm = z.infer<typeof firstAdministratorSchema>;

type SetupPageProps = {
  readonly requiresToken: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly onSetup: (input: SetupForm) => void;
};

export function SetupPage({ requiresToken, busy, error, onSetup }: SetupPageProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<SetupForm>({
    resolver: zodResolver(firstAdministratorSchema),
    defaultValues: { nome: "", email: "", password: "", passwordConfirmation: "" }
  });

  return (
    <main className="login-page setup-page">
      <section className="login-card setup-card" aria-labelledby="setup-title">
        <span className="setup-icon" aria-hidden="true"><ShieldCheck size={24} /></span>
        <span className="page-kicker">Configuração inicial</span>
        <h1 id="setup-title">Crie o primeiro administrador</h1>
        <p>Esta conta será responsável pela equipe, pelos acessos e pelas configurações do sistema.</p>

        <form onSubmit={handleSubmit(onSetup)}>
          <label>Nome<input autoComplete="name" {...register("nome")} /></label>
          {errors.nome && <small className="field-error">{errors.nome.message}</small>}
          <label>E-mail<input type="email" autoComplete="username" {...register("email")} /></label>
          {errors.email && <small className="field-error">{errors.email.message}</small>}
          <label>Senha<input type="password" autoComplete="new-password" {...register("password")} /></label>
          {errors.password && <small className="field-error">{errors.password.message}</small>}
          <label>Confirmar senha<input type="password" autoComplete="new-password" {...register("passwordConfirmation")} /></label>
          {errors.passwordConfirmation && <small className="field-error">{errors.passwordConfirmation.message}</small>}
          {requiresToken && (
            <label>
              Código de configuração
              <input type="password" autoComplete="off" required {...register("setupToken")} />
              <small>Use o código secreto definido na hospedagem. Ele nunca fica salvo no navegador.</small>
            </label>
          )}
          {error && <div className="login-error" role="alert">{error}</div>}
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? "Preparando acesso..." : "Criar administrador"}
          </Button>
        </form>
      </section>
    </main>
  );
}
