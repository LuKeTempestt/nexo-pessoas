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

export type UserPage = {
  readonly items: readonly User[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
};

export type UserSummary = { readonly total: number; readonly active: number; readonly hidden: number };
export type OperatorRole = "ADMIN" | "OPERADOR" | "AUDITOR";
export type Operator = {
  readonly id: string; readonly nome: string; readonly email: string;
  readonly role: OperatorRole; readonly ativo: boolean; readonly dataCadastro?: string;
};
export type Session = { readonly operator: Operator; readonly csrfToken: string };
export type OperatorInput = {
  readonly nome: string;
  readonly email: string;
  readonly password: string;
  readonly role: OperatorRole;
};
export type SetupStatus = {
  readonly available: boolean;
  readonly requiresToken: boolean;
  readonly configured: boolean;
};
export type AppSection = "users" | "team";
