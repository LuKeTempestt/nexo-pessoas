const USERS_ENDPOINT = "/api/usuarios";

async function request(path = "", options = {}) {
  let response;

  try {
    response = await fetch(`${USERS_ENDPOINT}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new Error("A API demorou demais para responder.");
    }
    throw new Error("Não foi possível conectar à API.");
  }

  if (response.status === 204) {
    return null;
  }

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.erro ?? "Não foi possível concluir a operação.");
  }

  return body;
}

export const usersApi = {
  list: () => request(),
  create: (user) => request("", {
    method: "POST",
    body: JSON.stringify(user)
  }),
  update: (id, user) => request(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(user)
  }),
  remove: (id) => request(`/${id}`, { method: "DELETE" })
};

