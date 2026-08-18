import { EyeOff, Pencil, Power, PowerOff, RotateCcw } from "lucide-react";
import { formatCpf, formatDate, formatDateTime, formatPhone, getInitials } from "../lib/formatters";
import type { User, UserView } from "../types/user";
import { Button } from "./Button";

type UserTableProps = {
  readonly users: readonly User[];
  readonly loading: boolean;
  readonly view: UserView;
  readonly onEdit: (user: User) => void;
  readonly onHide: (user: User) => void;
  readonly onRestore: (user: User) => void;
  readonly onToggleStatus: (user: User) => void;
};

export function UserTable({
  users,
  loading,
  view,
  onEdit,
  onHide,
  onRestore,
  onToggleStatus
}: UserTableProps) {
  const hiddenView = view === "hidden";
  const dateLabel = hiddenView ? "Ocultado em" : "Cadastrado em";

  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Lista de usuários cadastrados</caption>
        <thead>
          <tr>
            <th scope="col">Usuário</th>
            <th scope="col">Contato</th>
            <th scope="col">CPF</th>
            <th scope="col">Nascimento</th>
            <th scope="col">{dateLabel}</th>
            <th scope="col"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {loading && users.length === 0
            ? Array.from({ length: 4 }, (_, index) => (
                <tr className="skeleton-row" key={index} aria-hidden="true">
                  <td><span /></td><td><span /></td><td><span /></td>
                  <td><span /></td><td><span /></td><td><span /></td>
                </tr>
              ))
            : users.map((user) => (
                <tr key={user.id}>
                  <td data-label="Usuário">
                    <div className="user-cell">
                      <span className="avatar" aria-hidden="true">{getInitials(user.nome)}</span>
                      <span>
                        <strong>{user.nome}</strong>
                        <span className="user-meta">
                          <small>ID {user.id}</small>
                          <span className={`status-badge status-badge--${user.ativo ? "active" : "inactive"}`}>
                            {user.ativo ? "Ativo" : "Desativado"}
                          </span>
                        </span>
                      </span>
                    </div>
                  </td>
                  <td data-label="Contato">
                    <div className="contact-cell">
                      <span>{user.email}</span>
                      <small>{formatPhone(user.telefone)}</small>
                    </div>
                  </td>
                  <td className="data-mono" data-label="CPF">{formatCpf(user.cpf)}</td>
                  <td data-label="Nascimento">{formatDate(user.dataNascimento)}</td>
                  <td data-label={dateLabel}>
                    {formatDateTime(user.dataExclusao ?? user.dataCadastro)}
                  </td>
                  <td className="row-actions" data-label="Ações">
                    {hiddenView ? (
                      <Button
                        variant="icon"
                        className="button--restore-icon"
                        type="button"
                        title="Restaurar usuário"
                        aria-label={`Restaurar ${user.nome}`}
                        onClick={() => onRestore(user)}
                      >
                        <RotateCcw size={17} aria-hidden="true" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="icon"
                          type="button"
                          title="Editar usuário"
                          aria-label={`Editar ${user.nome}`}
                          onClick={() => onEdit(user)}
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="icon"
                          className={user.ativo ? "button--status-off" : "button--restore-icon"}
                          type="button"
                          title={user.ativo ? "Desativar usuário" : "Ativar usuário"}
                          aria-label={`${user.ativo ? "Desativar" : "Ativar"} ${user.nome}`}
                          onClick={() => onToggleStatus(user)}
                        >
                          {user.ativo
                            ? <PowerOff size={17} aria-hidden="true" />
                            : <Power size={17} aria-hidden="true" />}
                        </Button>
                        <Button
                          variant="icon"
                          className="button--delete-icon"
                          type="button"
                          title="Ocultar usuário"
                          aria-label={`Ocultar ${user.nome}`}
                          onClick={() => onHide(user)}
                        >
                          <EyeOff size={17} aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
