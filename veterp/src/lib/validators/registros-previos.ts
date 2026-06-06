import { z } from "zod";

export const createRegistroPrevioSchema = z.object({
  mascota_id: z.string().uuid("ID de mascota inválido."),
  fecha_historica_date: z.string().refine((dateStr) => {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d <= new Date();
  }, { message: "La fecha debe ser válida y no puede estar en el futuro." }),
  fecha_aproximada_bool: z.boolean().default(false),
  titulo_text: z.string().trim().min(3, "El título es obligatorio.").max(120, "El título es muy largo."),
  descripcion_text: z.string().trim().min(5, "La descripción es obligatoria.").max(2000, "La descripción es muy larga."),
  fuente_text: z.string().trim().max(100, "La fuente es muy larga.").nullable().optional(),
});

export type CreateRegistroPrevioInput = z.infer<typeof createRegistroPrevioSchema>;

export const anularRegistroPrevioSchema = z.object({
  id: z.string().uuid("ID de registro inválido."),
  mascota_id: z.string().uuid("ID de mascota inválido."),
  motivo_anulacion_text: z.string().trim().min(5, "El motivo de anulación es obligatorio y debe ser descriptivo.").max(300, "El motivo es muy largo."),
});

export type AnularRegistroPrevioInput = z.infer<typeof anularRegistroPrevioSchema>;
