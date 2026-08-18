import { describe, expect, it } from "vitest";
import { userSchema } from "./userSchema";

describe("userSchema", () => {
  it("aceita um cadastro válido", () => {
    const result = userSchema.safeParse({
      nome: "Maria da Silva",
      email: "maria@exemplo.com",
      cpf: "529.982.247-25",
      telefone: "(11) 99999-9999",
      dataNascimento: "1995-03-15"
    });
    expect(result.success).toBe(true);
  });

  it("rejeita CPF inválido e nascimento futuro", () => {
    const result = userSchema.safeParse({
      nome: "Maria da Silva",
      email: "maria@exemplo.com",
      cpf: "111.111.111-11",
      telefone: "(11) 99999-9999",
      dataNascimento: "2999-03-15"
    });
    expect(result.success).toBe(false);
  });
});
