export type User = {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly cpf: string;
  readonly telefone: string;
  readonly dataNascimento: string;
  readonly dataCadastro: string;
  readonly ativo: boolean;
  readonly dataDesativacao: string | null;
  readonly dataExclusao: string | null;
};

export type UserInput = Omit<
  User,
  "id" | "dataCadastro" | "ativo" | "dataDesativacao" | "dataExclusao"
>;

export type SortOption = "recent" | "oldest" | "name-asc" | "name-desc";

export type UserView = "active" | "hidden";
