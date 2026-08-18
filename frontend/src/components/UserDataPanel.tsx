import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UserPlus
} from "lucide-react";
import { formatCpf, formatDate, formatDateTime, formatPhone, getInitials } from "../lib/formatters";
import type { SortOption, User } from "../types/user";
import { Button } from "./Button";

type UserDataPanelProps = {
  users: User[];
  totalResults: number;
  query: string;
  sort: SortOption;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onRefresh: () => void;
  onExport: () => void;
};

function resultLabel(total: number): string {
  return `${total} ${total === 1 ? "registro" : "registros"}`;
}

export function UserDataPanel({
  users,
  totalResults,
  query,
  sort,
  page,
  totalPages,
  loading,
  error,
  onQueryChange,
  onSortChange,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
  onRefresh,
  onExport
}: UserDataPanelProps) {
  const hasQuery = query.trim().length > 0;
  const showEmpty = !loading && !error && users.length === 0;

  return (
    <section className="data-panel" aria-labelledby="list-title" aria-busy={loading}>
      <div className="data-panel__rail" aria-hidden="true" />
      <div className="data-toolbar">
        <div className="data-toolbar__title">
          <h2 id="list-title">Base de usuários</h2>
          <p>{loading ? "Atualizando dados..." : resultLabel(totalResults)}</p>
        </div>

        <div className="data-toolbar__actions">
          <label className="search" htmlFor="search-users">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar usuários</span>
            <input
              id="search-users"
              type="search"
              value={query}
              placeholder="Buscar nome, e-mail, CPF ou telefone"
              autoComplete="off"
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </label>

          <label className="sort-control">
            <span className="sr-only">Ordenar usuários</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortOption)}
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="name-asc">Nome: A–Z</option>
              <option value="name-desc">Nome: Z–A</option>
            </select>
          </label>

          <Button
            className="data-export"
            type="button"
            title="Exportar CSV"
            aria-label="Exportar resultados em CSV"
            disabled={totalResults === 0}
            onClick={onExport}
          >
            <Download size={18} aria-hidden="true" />
            <span>Exportar CSV</span>
          </Button>
          <Button
            variant="icon"
            type="button"
            title="Atualizar lista"
            aria-label="Atualizar lista"
            disabled={loading}
            onClick={onRefresh}
          >
            <RefreshCw className={loading ? "spin" : ""} size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="error-state" role="alert">
          <strong>Não foi possível carregar os usuários.</strong>
          <span>{error}</span>
          <Button type="button" onClick={onRefresh}>Tentar novamente</Button>
        </div>
      ) : null}

      {!error && !showEmpty ? (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Lista de usuários cadastrados</caption>
            <thead>
              <tr>
                <th scope="col">Usuário</th>
                <th scope="col">Contato</th>
                <th scope="col">CPF</th>
                <th scope="col">Nascimento</th>
                <th scope="col">Cadastrado em</th>
                <th scope="col"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0
                ? Array.from({ length: 4 }, (_, index) => (
                    <tr className="skeleton-row" key={index} aria-hidden="true">
                      <td><span /></td><td><span /></td><td><span /></td>
                      <td><span /></td><td><span /></td><td><span /></td>
                    </tr>
                  ))
                : users.map((user) => (
                    <tr key={user.id}>
                      <td data-label="Usuário">
                        <div className="user-cell">
                          <span className="avatar" aria-hidden="true">{getInitials(user.nome)}</span>
                          <span>
                            <strong>{user.nome}</strong>
                            <small>ID {user.id}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label="Contato">
                        <div className="contact-cell">
                          <span>{user.email}</span>
                          <small>{formatPhone(user.telefone)}</small>
                        </div>
                      </td>
                      <td className="data-mono" data-label="CPF">{formatCpf(user.cpf)}</td>
                      <td data-label="Nascimento">{formatDate(user.dataNascimento)}</td>
                      <td data-label="Cadastrado em">{formatDateTime(user.dataCadastro)}</td>
                      <td className="row-actions" data-label="Ações">
                        <Button
                          variant="icon"
                          type="button"
                          title="Editar usuário"
                          aria-label={`Editar ${user.nome}`}
                          onClick={() => onEdit(user)}
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="icon"
                          className="button--delete-icon"
                          type="button"
                          title="Excluir usuário"
                          aria-label={`Excluir ${user.nome}`}
                          onClick={() => onDelete(user)}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="empty-state">
          <UserPlus size={34} aria-hidden="true" />
          <strong>{hasQuery ? "Nenhum resultado encontrado" : "Nenhum usuário cadastrado"}</strong>
          <span>
            {hasQuery
              ? "Revise os termos da busca ou limpe o filtro."
              : "Crie o primeiro registro para começar."}
          </span>
          {hasQuery
            ? <Button type="button" onClick={() => onQueryChange("")}>Limpar busca</Button>
            : <Button type="button" onClick={onCreate}>Cadastrar usuário</Button>}
        </div>
      ) : null}

      {!loading && !error && totalResults > 0 ? (
        <footer className="pagination">
          <span>Página {page} de {totalPages}</span>
          <div>
            <Button
              variant="icon"
              type="button"
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>
            <Button
              variant="icon"
              type="button"
              aria-label="Próxima página"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
