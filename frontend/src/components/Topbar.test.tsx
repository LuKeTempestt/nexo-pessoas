import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Operator, OperatorRole } from "../types/user";
import { Topbar } from "./Topbar";

function operator(role: OperatorRole): Operator {
  return {
    id: "1",
    nome: "Pessoa de Teste",
    email: "pessoa@nexo.local",
    role,
    ativo: true
  };
}

describe("Topbar", () => {
  it("mostra equipe e auditoria para administrador", () => {
    render(<Topbar operator={operator("ADMIN")} section="users" onSectionChange={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Equipe e acessos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Auditoria" })).toBeInTheDocument();
  });

  it("mostra auditoria, mas não gestão de equipe, para auditor", () => {
    render(<Topbar operator={operator("AUDITOR")} section="users" onSectionChange={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Auditoria" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Equipe e acessos" })).not.toBeInTheDocument();
  });

  it("restringe operador à área de usuários", () => {
    const onSectionChange = vi.fn();
    render(<Topbar operator={operator("OPERADOR")} section="users" onSectionChange={onSectionChange} onLogout={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Auditoria" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Usuários" }));
    expect(onSectionChange).toHaveBeenCalledWith("users");
  });
});
