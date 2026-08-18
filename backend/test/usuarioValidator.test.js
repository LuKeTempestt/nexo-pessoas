const test = require("node:test");
const assert = require("node:assert/strict");

const AppError = require("../src/errors/AppError");
const {
  validarCpf,
  parseUsuarioInput,
  parseId
} = require("../src/validation/usuarioValidator");

test("aceita um CPF válido", () => {
  // Given
  const cpf = "52998224725";

  // When
  const resultado = validarCpf(cpf);

  // Then
  assert.equal(resultado, true);
});

test("rejeita CPF com todos os dígitos iguais", () => {
  // Given
  const cpf = "11111111111";

  // When
  const resultado = validarCpf(cpf);

  // Then
  assert.equal(resultado, false);
});

test("normaliza os dados válidos de um usuário", () => {
  // Given
  const entrada = {
    nome: "  Maria da Silva  ",
    email: "  MARIA@EXEMPLO.COM ",
    cpf: "529.982.247-25",
    telefone: " (11) 99999-9999 ",
    dataNascimento: "1995-03-15"
  };

  // When
  const usuario = parseUsuarioInput(
    entrada,
    new Date("2026-08-18T12:00:00-03:00")
  );

  // Then
  assert.deepEqual(usuario, {
    nome: "Maria da Silva",
    email: "maria@exemplo.com",
    cpf: "52998224725",
    telefone: "11999999999",
    dataNascimento: "1995-03-15"
  });
});

test("rejeita data de nascimento futura", () => {
  // Given
  const entrada = {
    nome: "Maria da Silva",
    email: "maria@exemplo.com",
    cpf: "52998224725",
    telefone: "11999999999",
    dataNascimento: "2027-01-01"
  };

  // When / Then
  assert.throws(
    () => parseUsuarioInput(
      entrada,
      new Date("2026-08-18T12:00:00-03:00")
    ),
    (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /futuro/i);
      return true;
    }
  );
});

test("converte um ID positivo", () => {
  // Given
  const entrada = "12";

  // When
  const id = parseId(entrada);

  // Then
  assert.equal(id, 12);
});

test("rejeita um ID inválido", () => {
  // Given
  const entrada = "abc";

  // When / Then
  assert.throws(
    () => parseId(entrada),
    (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});
