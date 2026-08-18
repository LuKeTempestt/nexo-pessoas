import type { User, UserInput } from "../types/user";

const USERS_ENDPOINT = "/api/usuarios";

type ApiError = {
  erro?: string;
};

async function request<T>(path = "", options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${USERS_ENDPOINT}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
    throw new Error(body.erro ?? "Não foi possível concluir a operação.");
  }

  return body;
}

export const usersApi = {
  list: () => request<User[]>(),
  create: (user: UserInput) => request<User>("", {
    method: "POST",
    body: JSON.stringify(user)
  }),
  update: (id: string, user: UserInput) => request<User>(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(user)
  }),
  remove: (id: string) => request<void>(`/${id}`, { method: "DELETE" })
};
