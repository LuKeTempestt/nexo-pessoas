import type { SortOption, User } from "../types/user";
import { onlyDigits } from "./formatters";

const dateOnlyFormatter = new Intl.DateTimeFormat("pt-BR");

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function filterUsers(users: readonly User[], query: string): User[] {
  const normalizedQuery = normalize(query.trim());
  const numericQuery = onlyDigits(query);

  if (!normalizedQuery) return [...users];

  return users.filter((user) => {
    const text = normalize(`${user.nome} ${user.email}`);
    const numbers = `${user.id} ${onlyDigits(user.cpf)} ${onlyDigits(user.telefone)}`;
    return text.includes(normalizedQuery)
      || (numericQuery.length > 0 && numbers.includes(numericQuery));
  });
}

export function sortUsers(users: readonly User[], sort: SortOption): User[] {
  return [...users].sort((first, second) => {
    if (sort === "name-asc") return first.nome.localeCompare(second.nome, "pt-BR");
    if (sort === "name-desc") return second.nome.localeCompare(first.nome, "pt-BR");

    const firstDate = new Date(first.dataExclusao ?? first.dataCadastro).getTime();
    const secondDate = new Date(second.dataExclusao ?? second.dataCadastro).getTime();
    return sort === "oldest" ? firstDate - secondDate : secondDate - firstDate;
  });
}

export function countCreatedToday(users: readonly User[], now = new Date()): number {
  const today = dateOnlyFormatter.format(now);
  return users.filter((user) => (
    dateOnlyFormatter.format(new Date(user.dataCadastro)) === today
  )).length;
}

export function countActiveUsers(users: readonly User[]): number {
  return users.filter((user) => user.ativo).length;
}
