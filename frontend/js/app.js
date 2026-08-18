import { usersApi } from "./api.js";
import {
  bindEvents,
  fillForm,
  openDeleteDialog,
  readForm,
  renderUsers,
  resetForm,
  setBusy,
  showMessage
} from "./ui.js";

const state = {
  users: [],
  editingId: null,
  pendingDeleteId: null
};

async function loadUsers() {
  try {
    state.users = await usersApi.list();
    renderUsers(state.users, {
      onEdit: startEdit,
      onDelete: requestDelete
    });
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function startEdit(user) {
  state.editingId = user.id;
  fillForm(user);
}

function cancelEdit() {
  state.editingId = null;
  resetForm();
}

function requestDelete(user) {
  state.pendingDeleteId = user.id;
  openDeleteDialog(user);
}

async function confirmDelete() {
  if (state.pendingDeleteId === null) {
    return;
  }

  try {
    await usersApi.remove(state.pendingDeleteId);

    if (state.editingId === state.pendingDeleteId) {
      cancelEdit();
    }

    state.pendingDeleteId = null;
    showMessage("Usuário excluído com sucesso.", "success");
    await loadUsers();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function submitForm(event) {
  event.preventDefault();
  event.currentTarget.classList.add("was-validated");

  if (!event.currentTarget.reportValidity()) {
    return;
  }

  const editing = state.editingId !== null;
  setBusy(true);

  try {
    if (editing) {
      await usersApi.update(state.editingId, readForm());
    } else {
      await usersApi.create(readForm());
    }

    cancelEdit();
    showMessage(
      editing
        ? "Usuário atualizado com sucesso."
        : "Usuário cadastrado com sucesso.",
      "success"
    );
    await loadUsers();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
}

bindEvents({
  onSubmit: submitForm,
  onCancelEdit: cancelEdit,
  onRefresh: loadUsers,
  onConfirmDelete: confirmDelete
});

loadUsers();
