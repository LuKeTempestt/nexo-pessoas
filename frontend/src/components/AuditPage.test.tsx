import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auditApi } from "../lib/api";
import { AuditPage } from "./AuditPage";

vi.mock("../lib/api", () => ({ auditApi: { list: vi.fn() } }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuditPage /></QueryClientProvider>);
}

describe("AuditPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra eventos e navega pelas páginas", async () => {
    vi.mocked(auditApi.list).mockImplementation(async (page) => ({
      items: [{ id: page, operadorEmail: "auditor@nexo.local", acao: "USUARIO_ATUALIZADO", entidadeId: 42, detalhes: { campo: "email" }, dataEvento: "2026-08-22T12:30:00Z" }],
      page, pageSize: 20, total: 21, totalPages: 2
    }));

    renderPage();
    expect(await screen.findByText("Usuário atualizado")).toBeInTheDocument();
    expect(screen.getByText("auditor@nexo.local")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    await waitFor(() => expect(auditApi.list).toHaveBeenLastCalledWith(2));
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("explica quando ainda não há eventos", async () => {
    vi.mocked(auditApi.list).mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 });
    renderPage();
    expect(await screen.findByText("Nenhum evento registrado")).toBeInTheDocument();
  });

  it("permite tentar novamente depois de uma falha", async () => {
    vi.mocked(auditApi.list)
      .mockRejectedValueOnce(new Error("Serviço indisponível"))
      .mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 });

    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Nenhum evento registrado")).toBeInTheDocument();
    expect(auditApi.list).toHaveBeenCalledTimes(2);
  });
});
