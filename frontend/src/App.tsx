import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { Button } from "./components/Button";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { LoginPage } from "./components/LoginPage";
import { PermanentDeleteDialog } from "./components/PermanentDeleteDialog";
import { Metrics } from "./components/Metrics";
import { Toast, type ToastState } from "./components/Toast";
import { Topbar } from "./components/Topbar";
import { UserDataPanel } from "./components/UserDataPanel";
import { UserFormDialog } from "./components/UserFormDialog";
import { authApi, usersApi } from "./lib/api";
import { downloadUsersCsv } from "./lib/exportCsv";
import type { SortOption, User, UserInput, UserPage, UserView } from "./types/user";

const PAGE_SIZE = 8;
const EMPTY_PAGE: UserPage = { items: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

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
  const [permanentDeletingUser, setPermanentDeletingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: authApi.me, retry: false });
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { readonly email: string; readonly password: string }) => authApi.login(email, password),
    onSuccess: (session) => queryClient.setQueryData(["session"], session)
  });
  const usersQuery = useQuery({
    queryKey: ["users", view, page, deferredQuery, sort],
    queryFn: () => usersApi.list(view, page, deferredQuery, sort),
    enabled: Boolean(sessionQuery.data),
    staleTime: 30_000
  });
  const summaryQuery = useQuery({ queryKey: ["users", "summary"], queryFn: usersApi.summary, enabled: Boolean(sessionQuery.data) });
  const currentPage = usersQuery.data ?? EMPTY_PAGE;
  const session = sessionQuery.data;
  const canWrite = session?.operator.role === "ADMIN" || session?.operator.role === "OPERADOR";
  const canPermanentDelete = session?.operator.role === "ADMIN";

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

  const permanentDeleteMutation = useMutation({
    mutationFn: usersApi.permanentDelete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setPermanentDeletingUser(null);
      setToast({ type: "success", text: "Usuário apagado definitivamente." });
    },
    onError: (error: Error) => setToast({ type: "error", text: error.message })
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => { queryClient.clear(); setToast(null); }
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

  if (sessionQuery.isLoading) return <main className="loading-screen">Carregando...</main>;
  if (!session) {
    return <LoginPage busy={loginMutation.isPending} error={loginMutation.error instanceof Error ? loginMutation.error.message : null} onLogin={(email, password) => loginMutation.mutate({ email, password })} />;
  }

  return (
    <>
      <Topbar operator={session.operator} onLogout={() => logoutMutation.mutate()} />
      <main className="shell page">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <span className="page-kicker">Gestão de cadastros</span>
            <h1 id="page-title">Usuários</h1>
            <p>Consulte e mantenha os dados das pessoas cadastradas.</p>
          </div>
          <div className="page-heading__actions">
            {canWrite && <Button
              variant="primary"
              type="button"
              icon={<Plus size={18} aria-hidden="true" />}
              onClick={openCreate}
            >
              Novo usuário
            </Button>}
          </div>
        </section>

        <Metrics
          total={summaryQuery.data?.total ?? 0}
          active={summaryQuery.data?.active ?? 0}
        />

        <UserDataPanel
          users={currentPage.items}
          totalResults={currentPage.total}
          query={query}
          sort={sort}
          page={page}
          totalPages={currentPage.totalPages}
          loading={usersQuery.isLoading || usersQuery.isFetching}
          error={usersQuery.error instanceof Error ? usersQuery.error.message : null}
          view={view}
          onQueryChange={setQuery}
          onSortChange={setSort}
          onPageChange={setPage}
          onCreate={openCreate}
          onEdit={openEdit}
          onHide={setDeletingUser}
          onRestore={(user) => restoreMutation.mutate(user.id)}
          onToggleStatus={(user) => statusMutation.mutate(user)}
          onPermanentDelete={setPermanentDeletingUser}
          canWrite={canWrite}
          canPermanentDelete={canPermanentDelete}
          onViewChange={changeView}
          onRefresh={() => void usersQuery.refetch()}
          onExport={() => downloadUsersCsv(currentPage.items)}
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
      <PermanentDeleteDialog
        user={permanentDeletingUser}
        busy={permanentDeleteMutation.isPending}
        onCancel={() => { if (!permanentDeleteMutation.isPending) setPermanentDeletingUser(null); }}
        onConfirm={() => { if (permanentDeletingUser) permanentDeleteMutation.mutate(permanentDeletingUser.id); }}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
