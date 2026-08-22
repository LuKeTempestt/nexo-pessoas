import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ClipboardList, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { auditApi } from "../lib/api";
import { formatDateTime } from "../lib/formatters";
import type { AuditEvent, AuditPage as AuditPageData } from "../types/user";
import { Button } from "./Button";

const EMPTY_PAGE: AuditPageData = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };

const ACTION_LABELS: Readonly<Record<string, string>> = {
  USUARIO_CRIADO: "Usuário criado",
  USUARIO_ATUALIZADO: "Usuário atualizado",
  USUARIO_OCULTADO: "Usuário ocultado",
  USUARIO_RESTAURADO: "Usuário restaurado",
  USUARIO_ATIVADO: "Usuário ativado",
  USUARIO_DESATIVADO: "Usuário desativado",
  USUARIO_APAGADO_PERMANENTEMENTE: "Usuário excluído definitivamente",
  OPERADOR_CRIADO: "Conta criada",
  OPERADOR_PERFIL_ALTERADO: "Perfil alterado",
  OPERADOR_ATIVADO: "Conta ativada",
  OPERADOR_DESATIVADO: "Conta desativada",
  OPERADOR_SENHA_REDEFINIDA: "Senha redefinida",
  OPERADOR_SESSOES_REVOGADAS: "Sessões revogadas"
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replaceAll("_", " ");
}

function detailsLabel(event: AuditEvent): string {
  const entries = Object.entries(event.detalhes);
  if (entries.length === 0) return "Sem detalhes adicionais";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

export function AuditPage() {
  const [page, setPage] = useState(1);
  const auditQuery = useQuery({
    queryKey: ["audit", page],
    queryFn: () => auditApi.list(page),
    staleTime: 30_000
  });
  const currentPage = auditQuery.data ?? EMPTY_PAGE;

  return (
    <main className="shell page">
      <section className="page-heading" aria-labelledby="audit-title">
        <div><span className="page-kicker">Governança</span><h1 id="audit-title">Auditoria</h1><p>Acompanhe operações sensíveis e identifique quem realizou cada alteração.</p></div>
      </section>
      <section className="access-summary" aria-label="Integridade da trilha">
        <ShieldCheck size={22} aria-hidden="true" /><div><strong>Trilha somente leitura</strong><span>Os eventos são registrados pelo backend e não podem ser alterados nesta tela.</span></div>
      </section>
      <section className="data-panel audit-panel" aria-labelledby="audit-list-title" aria-busy={auditQuery.isLoading || auditQuery.isFetching}>
        <div className="data-panel__rail" aria-hidden="true" />
        <div className="data-toolbar">
          <div className="data-toolbar__title"><h2 id="audit-list-title">Eventos registrados</h2><p>{currentPage.total} eventos</p></div>
          <Button variant="icon" type="button" title="Atualizar auditoria" aria-label="Atualizar auditoria" onClick={() => void auditQuery.refetch()}><RefreshCw className={auditQuery.isFetching ? "spin" : undefined} size={18} /></Button>
        </div>
        {auditQuery.isLoading ? <div className="empty-state"><span>Carregando eventos...</span></div> : null}
        {auditQuery.error instanceof Error ? <div className="error-state" role="alert"><strong>Não foi possível carregar a auditoria.</strong><span>{auditQuery.error.message}</span><Button type="button" onClick={() => void auditQuery.refetch()}>Tentar novamente</Button></div> : null}
        {auditQuery.data && currentPage.items.length > 0 ? <div className="table-wrap"><table className="audit-table"><caption className="sr-only">Trilha de auditoria do sistema</caption><thead><tr><th scope="col">Data</th><th scope="col">Responsável</th><th scope="col">Ação</th><th scope="col">Registro</th><th scope="col">Detalhes</th></tr></thead><tbody>
          {currentPage.items.map((event) => <tr key={event.id}>
            <td data-label="Data"><time dateTime={event.dataEvento}>{formatDateTime(event.dataEvento)}</time></td>
            <td data-label="Responsável"><span className="audit-operator">{event.operadorEmail}</span></td>
            <td data-label="Ação"><span className="audit-action">{actionLabel(event.acao)}</span></td>
            <td data-label="Registro" className="data-mono">{event.entidadeId ?? "—"}</td>
            <td data-label="Detalhes"><span className="audit-details" title={detailsLabel(event)}>{detailsLabel(event)}</span></td>
          </tr>)}
        </tbody></table></div> : null}
        {auditQuery.data && currentPage.items.length === 0 ? <div className="empty-state"><ClipboardList size={34} /><strong>Nenhum evento registrado</strong><span>As próximas operações sensíveis aparecerão aqui.</span></div> : null}
        {auditQuery.data && currentPage.totalPages > 1 ? <footer className="pagination"><span>Página {currentPage.page} de {currentPage.totalPages}</span><div><Button variant="icon" type="button" title="Página anterior" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={18} /></Button><Button variant="icon" type="button" title="Próxima página" aria-label="Próxima página" disabled={page >= currentPage.totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={18} /></Button></div></footer> : null}
      </section>
    </main>
  );
}
