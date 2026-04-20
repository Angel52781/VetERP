import { z } from "zod";

export const ordenServicioSchema = z.object({
  cliente_id: z.string().uuid("ID de cliente inválido"),
  mascota_id: z.string().uuid("ID de mascota inválido"),
});

export const entradaClinicaSchema = z.object({
  orden_id: z.string().uuid("ID de orden inválido"),
  tipo_text: z.string().min(1, "El tipo es requerido"),
  texto_text: z.string().min(1, "El texto es requerido"),
});

export const adjuntoSchema = z.object({
  orden_id: z.string().uuid("ID de orden inválido"),
  archivo_url: z.string().url("URL de archivo inválida"),
  descripcion_text: z.string().optional(),
});

export type OrdenServicioInput = z.infer<typeof ordenServicioSchema>;
export type EntradaClinicaInput = z.infer<typeof entradaClinicaSchema>;
export type AdjuntoInput = z.infer<typeof adjuntoSchema>;
