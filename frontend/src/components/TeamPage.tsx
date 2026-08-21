import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, LogOut, Plus, Power, PowerOff, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

import { operatorsApi } from "../lib/api";
import { formatDateTime, getInitials } from "../lib/formatters";
import type { Operator, OperatorInput, OperatorRole, Session } from "../types/user";
import { Button } from "./Button";
import { OperatorFormDialog } from "./OperatorFormDialog";
import { PasswordResetDialog } from "./PasswordResetDialog";
import { Toast, type ToastState } from "./Toast";

const ROLE_LABEL: Readonly<Record<OperatorRole, string>> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  AUDITOR: "Auditor"
};

function isOperatorRole(value: string): value is OperatorRole {
  return value === "ADMIN" || value === "OPERADOR" || value === "AUDITOR";
}

export function TeamPage({ session }: { readonly session: Session }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordOperator, setPasswordOperator] = useState<Operator | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const operatorsQuery = useQuery({ queryKey: ["operators"], queryFn: operatorsApi.list });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["operators"] });
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const createMutation = useMutation({
    mutationFn: (input: OperatorInput) => operatorsApi.create(input),
    onSuccess: () => { refresh(); setCreateOpen(false); setToast({ type: "success", text: "Conta criada com sucesso." }); },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { readonly id: string; readonly role: OperatorRole }) => operatorsApi.changeRole(id, role),
    onSuccess: () => { refresh(); setToast({ type: "success", text: "Perfil atualizado. As sessões anteriores foram encerradas." }); },
    onError: (error: Error) => { refresh(); setToast({ type: "error", text: error.message }); }
  });
  const statusMutation = useMutation({
    mutationFn: (operator: Operator) => operator.ativo ? operatorsApi.deactivate(operator.id) : operatorsApi.activate(operator.id),
    onSuccess: (_, operator) => { refresh(); setToast({ type: "success", text: operator.ativo ? "Acesso desativado." : "Acesso ativado." }); },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });
  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { readonly id: string; readonly password: string }) => operatorsApi.resetPassword(id, password),
    onSuccess: () => { refresh(); setPasswordOperator(null); setToast({ type: "success", text: "Senha redefinida e sessões encerradas." }); },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });
  const sessionsMutation = useMutation({
    mutationFn: operatorsApi.revokeSessions,
    onSuccess: () => { refresh(); setToast({ type: "success", text: "Sessões encerradas com sucesso." }); },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });

  return (
    <>
      <main className="shell page">
        <section className="page-heading" aria-labelledby="team-title">
          <div><span className="page-kicker">Administração</span><h1 id="team-title">Equipe e acessos</h1><p>Gerencie contas individuais, perfis e sessões da equipe.</p></div>
          <Button variant="primary" type="button" icon={<Plus size={18} aria-hidden="true" />} onClick={() => setCreateOpen(true)}>Nova conta</Button>
        </section>
        <section className="access-summary" aria-label="Resumo de segurança">
          <ShieldCheck size={22} aria-hidden="true" /><div><strong>Princípio do menor privilégio</strong><span>Conceda apenas o perfil necessário para cada responsabilidade.</span></div>
        </section>
        <section className="data-panel team-panel" aria-labelledby="team-list-title">
          <div className="data-panel__rail" aria-hidden="true" />
          <div className="data-toolbar"><div className="data-toolbar__title"><h2 id="team-list-title">Contas da equipe</h2><p>{operatorsQuery.data?.length ?? 0} contas</p></div><Button variant="icon" type="button" title="Atualizar contas" aria-label="Atualizar contas" onClick={() => void operatorsQuery.refetch()}><RefreshCw size={18} /></Button></div>
          {operatorsQuery.isLoading ? <div className="empty-state"><span>Carregando contas...</span></div> : null}
          {operatorsQuery.error instanceof Error ? <div className="error-state" role="alert"><strong>Não foi possível carregar a equipe.</strong><span>{operatorsQuery.error.message}</span></div> : null}
          {operatorsQuery.data ? <div className="table-wrap"><table className="team-table"><caption className="sr-only">Contas de acesso da equipe</caption><thead><tr><th scope="col">Pessoa</th><th scope="col">Perfil</th><th scope="col">Status</th><th scope="col">Criada em</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead><tbody>
            {operatorsQuery.data.map((operator) => {
              const self = operator.id === session.operator.id;
              return <tr key={operator.id}>
                <td data-label="Pessoa"><div className="user-cell"><span className="avatar" aria-hidden="true">{getInitials(operator.nome)}</span><span><strong>{operator.nome}</strong><small>{operator.email}</small></span></div></td>
                <td data-label="Perfil"><select className="role-select" aria-label={`Perfil de ${operator.nome}`} value={operator.role} disabled={self || roleMutation.isPending} onChange={(event) => { const role = event.currentTarget.value; if (isOperatorRole(role)) roleMutation.mutate({ id: operator.id, role }); }}><option value="ADMIN">Administrador</option><option value="OPERADOR">Operador</option><option value="AUDITOR">Auditor</option></select><small className="role-description">{ROLE_LABEL[operator.role]}</small></td>
                <td data-label="Status"><span className={`status-badge status-badge--${operator.ativo ? "active" : "inactive"}`}>{operator.ativo ? "Ativo" : "Desativado"}</span>{self ? <small className="self-label">Sua conta</small> : null}</td>
                <td data-label="Criada em">{operator.dataCadastro ? formatDateTime(operator.dataCadastro) : "—"}</td>
                <td className="row-actions" data-label="Ações">
                  <Button variant="icon" type="button" title="Redefinir senha" aria-label={`Redefinir senha de ${operator.nome}`} onClick={() => setPasswordOperator(operator)}><KeyRound size={17} /></Button>
                  {!self && <Button variant="icon" type="button" className={operator.ativo ? "button--status-off" : "button--restore-icon"} title={operator.ativo ? "Desativar acesso" : "Ativar acesso"} aria-label={`${operator.ativo ? "Desativar" : "Ativar"} acesso de ${operator.nome}`} onClick={() => statusMutation.mutate(operator)}>{operator.ativo ? <PowerOff size={17} /> : <Power size={17} />}</Button>}
                  {!self && <Button variant="icon" type="button" title="Encerrar sessões" aria-label={`Encerrar sessões de ${operator.nome}`} onClick={() => sessionsMutation.mutate(operator.id)}><LogOut size={17} /></Button>}
                </td>
              </tr>;
            })}
          </tbody></table></div> : null}
          {operatorsQuery.data?.length === 0 ? <div className="empty-state"><UsersRound size={34} /><strong>Nenhuma conta encontrada</strong></div> : null}
        </section>
      </main>
      {createOpen ? <OperatorFormDialog busy={createMutation.isPending} onClose={() => setCreateOpen(false)} onSubmit={(input) => createMutation.mutate(input)} /> : null}
      {passwordOperator ? <PasswordResetDialog key={passwordOperator.id} operator={passwordOperator} busy={passwordMutation.isPending} onClose={() => setPasswordOperator(null)} onSubmit={(password) => passwordMutation.mutate({ id: passwordOperator.id, password })} /> : null}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
