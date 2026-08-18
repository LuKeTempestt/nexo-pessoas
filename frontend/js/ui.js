import { formatCpf, formatPhone, formatDate } from "./formatters.js";

const elements = {
  form: document.querySelector("#userForm"),
  formTitle: document.querySelector("#formTitle"),
  formMode: document.querySelector("#formMode"),
  submitButton: document.querySelector("#submitButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  refreshButton: document.querySelector("#refreshButton"),
  tableBody: document.querySelector("#usersTableBody"),
  emptyState: document.querySelector("#emptyState"),
  totalUsers: document.querySelector("#totalUsuarios"),
  message: document.querySelector("#message"),
  deleteDialog: document.querySelector("#deleteDialog"),
  dialogDescription: document.querySelector("#dialogDescription"),
  confirmDeleteButton: document.querySelector("#confirmDeleteButton"),
  nome: document.querySelector("#nome"),
  email: document.querySelector("#email"),
  cpf: document.querySelector("#cpf"),
  telefone: document.querySelector("#telefone"),
  dataNascimento: document.querySelector("#dataNascimento")
};

function createCell(label, value, className = "") {
  const cell = document.createElement("td");
  cell.dataset.label = label;
  cell.textContent = value;
  cell.className = className;
  return cell;
}

function createAction(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button button--neutral table-action ${className}`;
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

export function renderUsers(users, actions) {
  elements.tableBody.replaceChildren();
  elements.totalUsers.textContent = String(users.length);
  elements.emptyState.classList.toggle("hidden", users.length !== 0);

  for (const user of users) {
    const row = document.createElement("tr");
    const actionsCell = createCell("Ações", "");
    actionsCell.className = "table-actions";
    actionsCell.append(
      createAction("Editar", "", () => actions.onEdit(user)),
      createAction("Excluir", "table-action--delete", () => {
        actions.onDelete(user);
      })
    );

    row.append(
      createCell("Nome", user.nome, "user-name"),
      createCell("E-mail", user.email),
      createCell("CPF", formatCpf(user.cpf)),
      createCell("Telefone", formatPhone(user.telefone)),
      createCell("Nascimento", formatDate(user.dataNascimento)),
      actionsCell
    );
    elements.tableBody.append(row);
  }
}

export function readForm() {
  return {
    nome: elements.nome.value,
    email: elements.email.value,
    cpf: elements.cpf.value,
    telefone: elements.telefone.value,
    dataNascimento: elements.dataNascimento.value
  };
}

export function fillForm(user) {
  elements.nome.value = user.nome;
  elements.email.value = user.email;
  elements.cpf.value = formatCpf(user.cpf);
  elements.telefone.value = formatPhone(user.telefone);
  elements.dataNascimento.value = user.dataNascimento;
  elements.formTitle.textContent = "Editar usuário";
  elements.formMode.textContent = `Registro #${user.id}`;
  elements.submitButton.textContent = "Salvar alterações";
  elements.cancelEditButton.classList.remove("hidden");
  elements.nome.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function resetForm() {
  elements.form.reset();
  elements.form.classList.remove("was-validated");
  elements.formTitle.textContent = "Cadastrar usuário";
  elements.formMode.textContent = "Novo registro";
  elements.submitButton.textContent = "Salvar usuário";
  elements.cancelEditButton.classList.add("hidden");
}

export function setBusy(busy) {
  elements.submitButton.disabled = busy;
  elements.refreshButton.disabled = busy;
  elements.submitButton.textContent = busy
    ? "Salvando..."
    : elements.cancelEditButton.classList.contains("hidden")
      ? "Salvar usuário"
      : "Salvar alterações";
}

export function showMessage(text, type) {
  elements.message.textContent = text;
  elements.message.className = `message message--${type}`;
}

export function openDeleteDialog(user) {
  elements.dialogDescription.textContent =
    `O cadastro de ${user.nome} será removido permanentemente.`;
  elements.deleteDialog.showModal();
}

export function bindEvents(handlers) {
  elements.form.addEventListener("submit", handlers.onSubmit);
  elements.cancelEditButton.addEventListener("click", handlers.onCancelEdit);
  elements.refreshButton.addEventListener("click", handlers.onRefresh);
  elements.cpf.addEventListener("input", (event) => {
    event.target.value = formatCpf(event.target.value);
  });
  elements.telefone.addEventListener("input", (event) => {
    event.target.value = formatPhone(event.target.value);
  });
  elements.deleteDialog.addEventListener("close", () => {
    if (elements.deleteDialog.returnValue === "confirm") {
      handlers.onConfirmDelete();
    }
  });
}
