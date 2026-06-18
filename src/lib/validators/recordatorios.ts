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

const seguimientoTipoLabels: Record<string, string> = {
  vacuna: "Vacuna",
  control: "Control / Refuerzo",
  laboratorio: "Laboratorio",
  medicacion: "Medicación",
  otro: "Otro",
  llamar_responsable: "Llamar responsable",
  aplicar_dosis: "Aplicar dosis",
  muestra_pendiente: "Muestra pendiente",
  revision: "Revisión",
  post_consulta: "Post consulta",
  administrativo: "Administrativo",
};

const seguimientoEstadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  resuelto: "Resuelto",
  cancelado: "Cancelado",
};

export const recordatorioSchema = z
  .object({
    mascota_id: z.string().uuid("ID de mascota invalido"),
    orden_id: z.string().uuid("ID de orden invalido").optional().nullable(),
    tipo_text: z.enum(seguimientoTipoValues, { message: "Tipo de seguimiento invalido" }),
    nombre_text: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    fecha_aplicacion_date: z.string().regex(isoDateRegex, "Fecha de aplicacion invalida"),
    proxima_fecha_date: z.union([z.string().regex(isoDateRegex, "Fecha proxima invalida"), z.literal("")]).optional().nullable().transform(val => val === "" ? null : val),
    notas_text: z.string().max(1000, "Las notas no deben superar 1000 caracteres").optional().nullable(),
    estado_text: z.enum(seguimientoEstadoValues).optional().nullable(),
    recurrencia_unidad_text: z.enum(["dias", "semanas", "meses", "anios"]).optional().nullable(),
    recurrencia_cada_int: z.number().int().positive().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.proxima_fecha_date) {
      if (data.proxima_fecha_date < data.fecha_aplicacion_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proxima_fecha_date"],
          message: "La proxima fecha debe ser igual o posterior a la aplicacion",
        });
      }
    }
    
    // Recurrence validation
    if (data.recurrencia_unidad_text && !data.recurrencia_cada_int) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrencia_cada_int"],
        message: "Indica cada cuánto se repite.",
      });
    }
    if (!data.recurrencia_unidad_text && data.recurrencia_cada_int) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrencia_unidad_text"],
        message: "Selecciona una unidad de repetición.",
      });
    }
  });

export function getSeguimientoTipoLabel(value: string | null | undefined): string {
  if (!value) return "Seguimiento";
  const normalized = value.trim().toLowerCase();
  if (normalized === "tto" || normalized === "tto.") return "Tratamiento";
  if (normalized === "recordatorio") return "Recordatorio";
  if (normalized === "seguimiento") return "Seguimiento";
  return seguimientoTipoLabels[normalized] ?? "Seguimiento";
}

export function getSeguimientoEstadoLabel(value: string | null | undefined): string {
  if (!value) return "Pendiente";
  return seguimientoEstadoLabels[value] ?? "Pendiente";
}

export function getRecurrenciaLabel(unidad: string | null | undefined): string {
  if (unidad === "dias") return "Días";
  if (unidad === "semanas") return "Semanas";
  if (unidad === "meses") return "Meses";
  if (unidad === "anios") return "Años";
  return "Sin repetición";
}

export function formatRecurrencia(cada: number | null | undefined, unidad: string | null | undefined): string | null {
  if (!cada || !unidad || unidad === "none") return null;
  
  if (unidad === "dias") return cada === 1 ? "Cada 1 día" : `Cada ${cada} días`;
  if (unidad === "semanas") return cada === 1 ? "Cada 1 semana" : `Cada ${cada} semanas`;
  if (unidad === "meses") return cada === 1 ? "Cada 1 mes" : `Cada ${cada} meses`;
  if (unidad === "anios") return cada === 1 ? "Cada 1 año" : `Cada ${cada} años`;
  
  return null;
}

export function calculateNextRecurrenceDate(
  baseDate: string | null | undefined,
  cada: number | null | undefined,
  unidad: string | null | undefined,
): string | null {
  if (!baseDate || !cada || cada < 1 || !unidad || unidad === "none") return null;
  if (!isoDateRegex.test(baseDate)) return null;

  const [year, month, day] = baseDate.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));

  if (unidad === "dias") nextDate.setUTCDate(nextDate.getUTCDate() + cada);
  else if (unidad === "semanas") nextDate.setUTCDate(nextDate.getUTCDate() + cada * 7);
  else if (unidad === "meses") nextDate.setUTCMonth(nextDate.getUTCMonth() + cada);
  else if (unidad === "anios") nextDate.setUTCFullYear(nextDate.getUTCFullYear() + cada);
  else return null;

  return nextDate.toISOString().slice(0, 10);
}

export const seguimientoIdSchema = z.string().uuid("ID de seguimiento invalido");

export const recordatorioResolucionSchema = z.object({
  id: seguimientoIdSchema,
  notas: z.string().max(1000, "Las notas no deben superar 1000 caracteres").optional().nullable(),
  crear_siguiente: z.boolean().optional(),
});

export const recordatorioReprogramacionSchema = z.object({
  id: seguimientoIdSchema,
  nuevaFecha: z.string().regex(isoDateRegex, "Fecha de reprogramacion invalida"),
});

export type RecordatorioInput = z.input<typeof recordatorioSchema>;
export type RecordatorioTipo = (typeof seguimientoTipoValues)[number];
export type RecordatorioEstado = (typeof seguimientoEstadoValues)[number];
