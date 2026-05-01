import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const seguimientoClinicoSchema = z
  .object({
    mascota_id: z.string().uuid("ID de mascota inválido"),
    orden_id: z.string().uuid("ID de orden inválido").optional(),
    tipo_text: z.enum(["vacuna", "control"], { message: "Tipo de seguimiento inválido" }),
    nombre_text: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    fecha_aplicacion_date: z.string().regex(isoDateRegex, "Fecha de aplicación inválida"),
    proxima_fecha_date: z.string().regex(isoDateRegex, "Fecha próxima inválida").optional(),
    notas_text: z.string().max(1000, "Las notas no deben superar 1000 caracteres").optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.proxima_fecha_date) return;
    if (data.proxima_fecha_date < data.fecha_aplicacion_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proxima_fecha_date"],
        message: "La próxima fecha debe ser igual o posterior a la aplicación",
      });
    }
  });

export type SeguimientoClinicoInput = z.infer<typeof seguimientoClinicoSchema>;
