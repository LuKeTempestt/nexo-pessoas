const AppError = require("../errors/AppError");

function tratadorErros(error, request, response, next) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      erro: error.message
    });
  }

  if (error instanceof SyntaxError && error.status === 400) {
    return response.status(400).json({
      erro: "O corpo da requisição contém JSON inválido."
    });
  }

  if (error.code === "23505") {
    const conflictMessages = {
      uq_usuarios_email: "Já existe um usuário com este e-mail.",
      uq_usuarios_cpf: "Já existe um usuário com este CPF.",
      uq_operadores_email: "Já existe uma conta de acesso com este e-mail.",
      operadores_email_key: "Já existe uma conta de acesso com este e-mail."
    };

    return response.status(409).json({
      erro: conflictMessages[error.constraint] ??
        "Já existe um usuário com esses dados."
    });
  }

  console.error(error);

  return response.status(500).json({
    erro: "Ocorreu um erro interno no servidor."
  });
}

module.exports = tratadorErros;
