import { z } from "zod";
import { onlyDigits } from "./formatters";

function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  const calculateDigit = (length: number): number => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(cpf[9])
    && calculateDigit(10) === Number(cpf[10]);
}

export const userSchema = z.object({
  nome: z.string().trim().min(3, "Informe pelo menos 3 caracteres.").max(120),
  email: z.email("Informe um e-mail válido.").max(254),
  cpf: z.string().refine(isValidCpf, "Informe um CPF válido."),
  telefone: z.string().refine(
    (value) => [10, 11].includes(onlyDigits(value).length),
    "Informe um telefone com DDD."
  ),
  dataNascimento: z.string().refine((value) => {
    if (!value) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date <= new Date();
  }, "Informe uma data válida e não futura.")
});

export type UserFormValues = z.infer<typeof userSchema>;
