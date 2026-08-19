import type { Session, SortOption, User, UserInput, UserPage, UserSummary } from "../types/user";

let csrfToken = "";

type ApiError = {
  erro?: string;
};

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...options.headers
      },
      signal: AbortSignal.timeout(8_000)
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("A API demorou demais para responder.");
    }
    throw new Error("Não foi possível conectar à API.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json() as T & ApiError;

  if (!response.ok) {
    throw new ApiRequestError(body.erro ?? "Não foi possível concluir a operação.", response.status);
  }

  return body;
}

export const usersApi = {
  list: (view: "active" | "hidden", page: number, query: string, sort: SortOption) => {
    const params = new URLSearchParams({ page: String(page), pageSize: "8", query, sort });
    const suffix = view === "hidden" ? "/ocultos" : "";
    return request<UserPage>(`/usuarios${suffix}?${params}`);
  },
  summary: () => request<UserSummary>("/usuarios/resumo"),
  create: (user: UserInput) => request<User>("/usuarios", {
    method: "POST",
    body: JSON.stringify(user)
  }),
  update: (id: string, user: UserInput) => request<User>(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(user)
  }),
  hide: (id: string) => request<void>(`/usuarios/${id}`, { method: "DELETE" }),
  permanentDelete: (id: string) => request<void>(`/usuarios/${id}/permanente`, { method: "DELETE" }),
  restore: (id: string) => request<User>(`/usuarios/${id}/restaurar`, { method: "PATCH" }),
  deactivate: (id: string) => request<User>(`/usuarios/${id}/desativar`, { method: "PATCH" }),
  activate: (id: string) => request<User>(`/usuarios/${id}/ativar`, { method: "PATCH" })
};

export const authApi = {
  async login(email: string, password: string) {
    const session = await request<Session>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password })
    });
    csrfToken = session.csrfToken;
    return session;
  },
  async me() {
    const session = await request<Session>("/auth/me");
    csrfToken = session.csrfToken;
    return session;
  },
  async logout() {
    await request<void>("/auth/logout", { method: "POST" });
    csrfToken = "";
  }
};
