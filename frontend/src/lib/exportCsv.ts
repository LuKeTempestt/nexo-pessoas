import type { User } from "../types/user";
import { formatCpf, formatDate, formatPhone } from "./formatters";

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function usersToCsv(users: readonly User[]): string {
  const header = ["ID", "Nome", "E-mail", "CPF", "Telefone", "Nascimento", "Status", "Cadastro"];
  const rows = users.map((user) => [
    user.id,
    user.nome,
    user.email,
    formatCpf(user.cpf),
    formatPhone(user.telefone),
    formatDate(user.dataNascimento),
    user.ativo ? "Ativo" : "Desativado",
    new Date(user.dataCadastro).toLocaleString("pt-BR")
  ]);

  return [header, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");
}

export function downloadUsersCsv(users: readonly User[]): void {
  const blob = new Blob(["\uFEFF", usersToCsv(users)], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
