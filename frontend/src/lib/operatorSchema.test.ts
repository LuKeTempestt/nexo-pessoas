import { describe, expect, it } from "vitest";
import { operatorSchema } from "./operatorSchema";

describe("operatorSchema", () => {
  it("normaliza uma conta individual válida", () => {
    // Given
    const input = {
      nome: "  Pessoa Operadora  ",
      email: "OPERADOR@EXEMPLO.COM",
      password: "Senha-segura-123",
      role: "OPERADOR"
    };

    // When
    const result = operatorSchema.parse(input);

    // Then
    expect(result).toEqual({
      nome: "Pessoa Operadora",
      email: "operador@exemplo.com",
      password: "Senha-segura-123",
      role: "OPERADOR"
    });
  });

  it("rejeita senha curta", () => {
    // Given
    const input = { nome: "Admin", email: "admin@exemplo.com", password: "curta", role: "ADMIN" };

    // When
    const result = operatorSchema.safeParse(input);

    // Then
    expect(result.success).toBe(false);
  });
});
