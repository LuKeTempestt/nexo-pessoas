const AppError = require("../errors/AppError");

function calcularDigitoCpf(parte) {
  let soma = 0;

  for (let indice = 0; indice < parte.length; indice += 1) {
    const peso = parte.length + 1 - indice;
    soma += Number(parte[indice]) * peso;
  }

  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function validarCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const primeiroDigito = calcularDigitoCpf(cpf.slice(0, 9));
  const segundoDigito = calcularDigitoCpf(cpf.slice(0, 10));

  return (
    primeiroDigito === Number(cpf[9]) &&
    segundoDigito === Number(cpf[10])
  );
}

function dataExiste(data) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const dataUtc = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataUtc.getUTCFullYear() === ano &&
    dataUtc.getUTCMonth() === mes - 1 &&
    dataUtc.getUTCDate() === dia
  );
}

function dataAtualNoBrasil(agora) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(agora);
}

function parseUsuarioInput(input, agora = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError("Envie os dados do usuário em formato JSON.", 400);
  }

  const usuario = {
    nome: String(input.nome ?? "").trim(),
    email: String(input.email ?? "").trim().toLowerCase(),
    cpf: String(input.cpf ?? "").replace(/\D/g, ""),
    telefone: String(input.telefone ?? "").replace(/\D/g, ""),
    dataNascimento: String(input.dataNascimento ?? "").trim()
  };

  if (usuario.nome.length < 3 || usuario.nome.length > 120) {
    throw new AppError("O nome deve ter entre 3 e 120 caracteres.", 400);
  }

  const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formatoEmail.test(usuario.email) || usuario.email.length > 254) {
    throw new AppError("Informe um e-mail válido.", 400);
  }

  if (!validarCpf(usuario.cpf)) {
    throw new AppError("Informe um CPF válido.", 400);
  }

  if (!/^\d{10,11}$/.test(usuario.telefone)) {
    throw new AppError("O telefone deve ter 10 ou 11 números.", 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(usuario.dataNascimento)) {
    throw new AppError("Informe uma data de nascimento válida.", 400);
  }

  if (!dataExiste(usuario.dataNascimento)) {
    throw new AppError("A data de nascimento informada não existe.", 400);
  }

  if (usuario.dataNascimento > dataAtualNoBrasil(agora)) {
    throw new AppError("A data de nascimento não pode estar no futuro.", 400);
  }

  return Object.freeze(usuario);
}

function parseId(input) {
  const id = Number(input);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError("O ID informado é inválido.", 400);
  }

  return id;
}

module.exports = {
  validarCpf,
  parseUsuarioInput,
  parseId
};
