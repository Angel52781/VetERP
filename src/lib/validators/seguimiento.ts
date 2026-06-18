import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const seguimientoTipoValues = [
  "vacuna",
  "control",
  "llamar_responsable",
  "aplicar_dosis",
  "muestra_pendiente",
  "revision",
  "post_consulta",
  "administrativo",
  "laboratorio",
] as const;

export const seguimientoEstadoValues = ["pendiente", "resuelto", "cancelado"] as const;

export const seguimientoClinicoSchema = z
  .object({
    mascota_id: z.string().uuid("ID de mascota invalido"),
    orden_id: z.string().uuid("ID de orden invalido").optional(),
    tipo_text: z.enum(seguimientoTipoValues, { message: "Tipo de seguimiento invalido" }),
    nombre_text: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    fecha_aplicacion_date: z.string().regex(isoDateRegex, "Fecha de aplicacion invalida"),
    proxima_fecha_date: z.string().regex(isoDateRegex, "Fecha proxima invalida").optional(),
    notas_text: z.string().max(1000, "Las notas no deben superar 1000 caracteres").optional(),
    estado_text: z.enum(seguimientoEstadoValues).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.proxima_fecha_date) return;
    if (data.proxima_fecha_date < data.fecha_aplicacion_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proxima_fecha_date"],
        message: "La proxima fecha debe ser igual o posterior a la aplicacion",
      });
    }
  });

export const seguimientoIdSchema = z.string().uuid("ID de seguimiento invalido");

export const seguimientoResolucionSchema = z.object({
  id: seguimientoIdSchema,
  notas: z.string().max(1000, "Las notas no deben superar 1000 caracteres").optional(),
});

export const seguimientoReprogramacionSchema = z.object({
  id: seguimientoIdSchema,
  nuevaFecha: z.string().regex(isoDateRegex, "Fecha de reprogramacion invalida"),
});

export type SeguimientoClinicoInput = z.infer<typeof seguimientoClinicoSchema>;
export type SeguimientoTipo = (typeof seguimientoTipoValues)[number];
export type SeguimientoEstado = (typeof seguimientoEstadoValues)[number];
