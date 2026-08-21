import { z } from "zod";

export const operatorSchema = z.object({
  nome: z.string().trim().min(3, "Informe pelo menos 3 caracteres.").max(120),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254),
  password: z.string().min(12, "Use pelo menos 12 caracteres."),
  role: z.enum(["ADMIN", "OPERADOR", "AUDITOR"])
});

export const firstAdministratorSchema = operatorSchema
  .omit({ role: true })
  .extend({
    passwordConfirmation: z.string(),
    setupToken: z.string().optional()
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    message: "As senhas precisam ser iguais.",
    path: ["passwordConfirmation"]
  });
