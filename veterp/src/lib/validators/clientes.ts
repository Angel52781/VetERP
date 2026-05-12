import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().min(2),
  telefono: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Email inválido.",
    }),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;

export const mascotaSchema = z.object({
  nombre: z.string().min(1),
  codigo_text: z
    .string()
    .trim()
    .max(50, "El código debe tener 50 caracteres o menos.")
    .optional()
    .nullable(),
  especie: z.string().optional(),
  raza: z.string().optional(),
  nacimiento: z.string().optional(),
  alertas_criticas: z.string().optional().nullable(),
  notas_manejo: z.string().optional().nullable(),
});

export type MascotaFormValues = z.infer<typeof mascotaSchema>;


