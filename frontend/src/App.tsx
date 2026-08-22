import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { LoginPage } from "./components/LoginPage";
import { AuditPage } from "./components/AuditPage";
import { SetupPage } from "./components/SetupPage";
import { TeamPage } from "./components/TeamPage";
import { Topbar } from "./components/Topbar";
import { UsersWorkspace } from "./components/UsersWorkspace";
import { authApi, setupApi } from "./lib/api";
import type { AppSection } from "./types/user";

type SetupInput = {
  readonly nome: string;
  readonly email: string;
  readonly password: string;
  readonly passwordConfirmation: string;
  readonly setupToken?: string;
};

export default function App() {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<AppSection>("users");
  const setupQuery = useQuery({ queryKey: ["setup"], queryFn: setupApi.status, retry: false });
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: authApi.me,
    retry: false,
    enabled: setupQuery.data?.configured === true
  });
  const setupMutation = useMutation({
    mutationFn: async (input: SetupInput) => {
      await setupApi.createAdministrator({
        nome: input.nome,
        email: input.email,
        password: input.password,
        ...(input.setupToken ? { setupToken: input.setupToken } : {})
      });
      return authApi.login(input.email, input.password);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["setup"], { available: false, requiresToken: false, configured: true });
      queryClient.setQueryData(["session"], session);
    }
  });
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { readonly email: string; readonly password: string }) => authApi.login(email, password),
    onSuccess: (session) => queryClient.setQueryData(["session"], session)
  });
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => { queryClient.clear(); setSection("users"); }
  });

  if (setupQuery.isLoading) return <main className="loading-screen">Preparando aplicação...</main>;
  if (setupQuery.error instanceof Error) return <main className="loading-screen error-screen">Não foi possível verificar a configuração inicial.<button type="button" onClick={() => void setupQuery.refetch()}>Tentar novamente</button></main>;
  if (setupQuery.data?.available) {
    return <SetupPage
      requiresToken={setupQuery.data.requiresToken}
      busy={setupMutation.isPending}
      error={setupMutation.error instanceof Error ? setupMutation.error.message : null}
      onSetup={(input) => setupMutation.mutate(input)}
    />;
  }
  if (sessionQuery.isLoading) return <main className="loading-screen">Carregando...</main>;
  if (!sessionQuery.data) {
    return <LoginPage
      busy={loginMutation.isPending}
      error={loginMutation.error instanceof Error ? loginMutation.error.message : null}
      onLogin={(email, password) => loginMutation.mutate({ email, password })}
    />;
  }

  const session = sessionQuery.data;
  const canReadAudit = session.operator.role === "ADMIN" || session.operator.role === "AUDITOR";
  const content = section === "team" && session.operator.role === "ADMIN"
    ? <TeamPage session={session} />
    : section === "audit" && canReadAudit
      ? <AuditPage />
      : <UsersWorkspace session={session} />;
  return (
    <>
      <Topbar
        operator={session.operator}
        section={section}
        onSectionChange={setSection}
        onLogout={() => logoutMutation.mutate()}
      />
      {content}
    </>
  );
}
