import {
  ChevronLeft,
  ChevronRight,
  Download,
  EyeOff,
  RefreshCw,
  Search,
  UserPlus
} from "lucide-react";
import type { SortOption, User, UserView } from "../types/user";
import { Button } from "./Button";
import { UserTable } from "./UserTable";

type UserDataPanelProps = {
  readonly users: readonly User[];
  readonly totalResults: number;
  readonly query: string;
  readonly sort: SortOption;
  readonly page: number;
  readonly totalPages: number;
  readonly loading: boolean;
  readonly error: string | null;
  readonly view: UserView;
  readonly onQueryChange: (value: string) => void;
  readonly onSortChange: (value: SortOption) => void;
  readonly onPageChange: (page: number) => void;
  readonly onCreate: () => void;
  readonly onEdit: (user: User) => void;
  readonly onHide: (user: User) => void;
  readonly onRestore: (user: User) => void;
  readonly onToggleStatus: (user: User) => void;
  readonly onViewChange: (view: UserView) => void;
  readonly onRefresh: () => void;
  readonly onExport: () => void;
};

function resultLabel(total: number): string {
  return `${total} ${total === 1 ? "registro" : "registros"}`;
}

function isSortOption(value: string): value is SortOption {
  return value === "recent"
    || value === "oldest"
    || value === "name-asc"
    || value === "name-desc";
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
  view,
  onQueryChange,
  onSortChange,
  onPageChange,
  onCreate,
  onEdit,
  onHide,
  onRestore,
  onToggleStatus,
  onViewChange,
  onRefresh,
  onExport
}: UserDataPanelProps) {
  const hasQuery = query.trim().length > 0;
  const showEmpty = !loading && !error && users.length === 0;
  const hiddenView = view === "hidden";

  return (
    <section className="data-panel" aria-labelledby="list-title" aria-busy={loading}>
      <div className="data-panel__rail" aria-hidden="true" />
      <div className="data-toolbar">
        <div className="data-toolbar__title">
          <h2 id="list-title">{hiddenView ? "Usuários ocultos" : "Base de usuários"}</h2>
          <p>{loading ? "Atualizando dados..." : resultLabel(totalResults)}</p>
          <div className="view-tabs" role="tablist" aria-label="Situação dos usuários">
            <button
              type="button"
              role="tab"
              aria-selected={!hiddenView}
              onClick={() => onViewChange("active")}
            >
              Ativos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={hiddenView}
              onClick={() => onViewChange("hidden")}
            >
              Ocultos
            </button>
          </div>
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
              onChange={(event) => {
                const value = event.currentTarget.value;
                if (isSortOption(value)) onSortChange(value);
              }}
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
        <UserTable
          users={users}
          loading={loading}
          view={view}
          onEdit={onEdit}
          onHide={onHide}
          onRestore={onRestore}
          onToggleStatus={onToggleStatus}
        />
      ) : null}

      {showEmpty ? (
        <div className="empty-state">
          {hiddenView
            ? <EyeOff size={34} aria-hidden="true" />
            : <UserPlus size={34} aria-hidden="true" />}
          <strong>
            {hasQuery
              ? "Nenhum resultado encontrado"
              : hiddenView ? "Nenhum usuário oculto" : "Nenhum usuário cadastrado"}
          </strong>
          <span>
            {hasQuery
              ? "Revise os termos da busca ou limpe o filtro."
              : hiddenView
                ? "Os usuários ocultados aparecerão aqui."
                : "Crie o primeiro registro para começar."}
          </span>
          {hasQuery
            ? <Button type="button" onClick={() => onQueryChange("")}>Limpar busca</Button>
            : hiddenView
              ? null
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
