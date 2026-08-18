import { describe, expect, it } from "vitest";
import { formatCpf, formatDate, formatPhone, getInitials } from "./formatters";

describe("formatters", () => {
  it("formata CPF para exibição", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("formata celular brasileiro", () => {
    expect(formatPhone("11999999999")).toBe("(11) 99999-9999");
  });

  it("formata data sem deslocar o dia", () => {
    expect(formatDate("1995-03-15")).toBe("15/03/1995");
  });

  it("gera iniciais do primeiro e último nome", () => {
    expect(getInitials("Maria da Silva")).toBe("MS");
  });
});
