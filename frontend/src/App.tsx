import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "./components/Button";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Metrics } from "./components/Metrics";
import { Toast, type ToastState } from "./components/Toast";
import { Topbar } from "./components/Topbar";
import { UserDataPanel } from "./components/UserDataPanel";
import { UserFormDialog } from "./components/UserFormDialog";
import { usersApi } from "./lib/api";
import { downloadUsersCsv } from "./lib/exportCsv";
import { countActiveUsers, filterUsers, sortUsers } from "./lib/userUtils";
import type { SortOption, User, UserInput, UserView } from "./types/user";

const PAGE_SIZE = 8;
const EMPTY_USERS: User[] = [];

type SaveVariables = {
  readonly user: User | null;
  readonly data: UserInput;
};

export default function App() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState<SortOption>("recent");
  const [view, setView] = useState<UserView>("active");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeUsersQuery = useQuery({
    queryKey: ["users", "active"],
    queryFn: usersApi.list,
    staleTime: 30_000
  });
  const hiddenUsersQuery = useQuery({
    queryKey: ["users", "hidden"],
    queryFn: usersApi.listHidden,
    enabled: view === "hidden",
    staleTime: 30_000
  });

  const activeUsers = activeUsersQuery.data ?? EMPTY_USERS;
  const currentQuery = view === "active" ? activeUsersQuery : hiddenUsersQuery;
  const users = currentQuery.data ?? EMPTY_USERS;
  const filteredUsers = useMemo(
    () => sortUsers(filterUsers(users, deferredQuery), sort),
    [deferredQuery, sort, users]
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visibleUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, sort, view]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const saveMutation = useMutation({
    mutationFn: ({ user, data }: SaveVariables) => (
      user ? usersApi.update(user.id, data) : usersApi.create(data)
    ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormOpen(false);
      setEditingUser(null);
      setToast({
        type: "success",
        text: variables.user
          ? "Usuário atualizado com sucesso."
          : "Usuário cadastrado com sucesso."
      });
    },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });

  const hideMutation = useMutation({
    mutationFn: usersApi.hide,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeletingUser(null);
      setToast({ type: "success", text: "Usuário ocultado com sucesso." });
    },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });

  const restoreMutation = useMutation({
    mutationFn: usersApi.restore,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setToast({ type: "success", text: "Usuário restaurado com sucesso." });
    },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });

  const statusMutation = useMutation({
    mutationFn: (user: User) => (
      user.ativo ? usersApi.deactivate(user.id) : usersApi.activate(user.id)
    ),
    onSuccess: (_, user) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setToast({
        type: "success",
        text: user.ativo
          ? "Usuário desativado com sucesso."
          : "Usuário ativado com sucesso."
      });
    },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });

  function openCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setFormOpen(true);
  }

  function changeView(nextView: UserView) {
    setView(nextView);
    setQuery("");
  }

  return (
    <>
      <Topbar />
      <main className="shell page">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <span className="page-kicker">Gestão de cadastros</span>
            <h1 id="page-title">Usuários</h1>
            <p>Consulte e mantenha os dados das pessoas cadastradas.</p>
          </div>
          <div className="page-heading__actions">
            <Button
              variant="primary"
              type="button"
              icon={<Plus size={18} aria-hidden="true" />}
              onClick={openCreate}
            >
              Novo usuário
            </Button>
          </div>
        </section>

        <Metrics
          total={activeUsers.length}
          active={countActiveUsers(activeUsers)}
        />

        <UserDataPanel
          users={visibleUsers}
          totalResults={filteredUsers.length}
          query={query}
          sort={sort}
          page={page}
          totalPages={totalPages}
          loading={currentQuery.isLoading || currentQuery.isFetching}
          error={currentQuery.error instanceof Error ? currentQuery.error.message : null}
          view={view}
          onQueryChange={setQuery}
          onSortChange={setSort}
          onPageChange={setPage}
          onCreate={openCreate}
          onEdit={openEdit}
          onHide={setDeletingUser}
          onRestore={(user) => restoreMutation.mutate(user.id)}
          onToggleStatus={(user) => statusMutation.mutate(user)}
          onViewChange={changeView}
          onRefresh={() => void currentQuery.refetch()}
          onExport={() => downloadUsersCsv(filteredUsers)}
        />
      </main>

      <UserFormDialog
        open={formOpen}
        user={editingUser}
        busy={saveMutation.isPending}
        onClose={() => {
          if (!saveMutation.isPending) {
            setFormOpen(false);
            setEditingUser(null);
          }
        }}
        onSubmit={(data) => saveMutation.mutate({ user: editingUser, data })}
      />
      <ConfirmDialog
        user={deletingUser}
        busy={hideMutation.isPending}
        onCancel={() => {
          if (!hideMutation.isPending) setDeletingUser(null);
        }}
        onConfirm={() => {
          if (deletingUser) hideMutation.mutate(deletingUser.id);
        }}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
