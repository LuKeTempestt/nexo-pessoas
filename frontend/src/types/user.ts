export type User = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  dataCadastro: string;
};

export type UserInput = Omit<User, "id" | "dataCadastro">;

export type SortOption = "recent" | "oldest" | "name-asc" | "name-desc";
