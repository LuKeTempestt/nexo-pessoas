import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupPage } from "./SetupPage";

describe("SetupPage", () => {
  it("envia o primeiro administrador sem exigir código no Docker local", async () => {
    // Given
    const onSetup = vi.fn();
    render(<SetupPage requiresToken={false} busy={false} error={null} onSetup={onSetup} />);

    // When
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Administrador local" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ADMIN@EXEMPLO.COM" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Senha-segura-123" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "Senha-segura-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar administrador" }));

    // Then
    await waitFor(() => {
      expect(onSetup.mock.calls[0]?.[0]).toEqual({
        nome: "Administrador local",
        email: "admin@exemplo.com",
        password: "Senha-segura-123",
        passwordConfirmation: "Senha-segura-123"
      });
    });
  });

  it("mostra o campo do código de configuração em produção", () => {
    // Given / When
    render(<SetupPage requiresToken busy={false} error={null} onSetup={vi.fn()} />);

    // Then
    expect(screen.getByLabelText(/Código de configuração/)).toBeInTheDocument();
  });
});
