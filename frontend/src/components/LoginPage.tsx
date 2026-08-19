import { useState, type FormEvent } from "react";
import { Button } from "./Button";

type LoginPageProps = {
  readonly busy: boolean;
  readonly error: string | null;
  readonly onLogin: (email: string, password: string) => void;
};

export function LoginPage({ busy, error, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(email, password);
  }
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <span className="page-kicker">Acesso seguro</span>
        <h1>Nexo Pessoas</h1>
        <p>Entre com sua conta de operação.</p>
        <label>E-mail<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Senha<input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <Button variant="primary" type="submit" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
      </form>
    </main>
  );
}
