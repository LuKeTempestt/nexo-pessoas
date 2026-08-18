import { describe, expect, it } from "vitest";
import type { User } from "../types/user";
import { countCreatedToday, filterUsers, sortUsers } from "./userUtils";

const users: User[] = [
  {
    id: "2",
    nome: "Álvaro Lima",
    email: "alvaro@exemplo.com",
    cpf: "52998224725",
    telefone: "11999999999",
    dataNascimento: "1990-01-02",
    dataCadastro: "2026-08-18T14:00:00.000Z"
  },
  {
    id: "1",
    nome: "Bianca Souza",
    email: "bianca@exemplo.com",
    cpf: "16899535009",
    telefone: "21988887777",
    dataNascimento: "1992-03-04",
    dataCadastro: "2026-08-17T14:00:00.000Z"
  }
];

describe("userUtils", () => {
  it("busca nomes ignorando acentos", () => {
    expect(filterUsers(users, "alvaro")).toEqual([users[0]]);
  });

  it("busca CPF mesmo quando a consulta contém máscara", () => {
    expect(filterUsers(users, "529.982")).toEqual([users[0]]);
  });

  it("ordena por nome sem alterar o array original", () => {
    const result = sortUsers(users, "name-desc");
    expect(result.map((user) => user.nome)).toEqual(["Bianca Souza", "Álvaro Lima"]);
    expect(users[0].nome).toBe("Álvaro Lima");
  });

  it("conta cadastros feitos no dia informado", () => {
    expect(countCreatedToday(users, new Date("2026-08-18T18:00:00.000Z"))).toBe(1);
  });
});
