import { describe, expect, it } from "vitest";
import type { User } from "../types/user";
import { usersToCsv } from "./exportCsv";

describe("usersToCsv", () => {
  it("gera CSV com separador brasileiro e escapa aspas", () => {
    const user: User = {
      id: "6",
      nome: "Maria \"Mia\" Silva",
      email: "maria@exemplo.com",
      cpf: "52998224725",
      telefone: "11999999999",
      dataNascimento: "1995-03-15",
      dataCadastro: "2026-08-18T14:00:00.000Z"
    };

    const csv = usersToCsv([user]);

    expect(csv).toContain('"ID";"Nome";"E-mail"');
    expect(csv).toContain('"Maria ""Mia"" Silva"');
    expect(csv).toContain('"529.982.247-25"');
  });
});
