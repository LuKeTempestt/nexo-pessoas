const test = require("node:test");
const assert = require("node:assert/strict");

const formattersPromise = import("../../frontend/js/formatters.js");

test("formata CPF para exibição", async () => {
  // Given
  const { formatCpf } = await formattersPromise;

  // When
  const result = formatCpf("52998224725");

  // Then
  assert.equal(result, "529.982.247-25");
});

test("formata celular brasileiro para exibição", async () => {
  // Given
  const { formatPhone } = await formattersPromise;

  // When
  const result = formatPhone("11999999999");

  // Then
  assert.equal(result, "(11) 99999-9999");
});

test("formata data sem deslocar o dia", async () => {
  // Given
  const { formatDate } = await formattersPromise;

  // When
  const result = formatDate("1995-03-15");

  // Then
  assert.equal(result, "15/03/1995");
});
