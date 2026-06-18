import { z } from "zod";

export const groomingEstadoSchema = z.enum(["pendiente", "completado"]);

export const guardarGroomingSchema = z.object({
  cita_id: z.string().uuid(),
  mascota_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  observaciones_text: z.string().optional().nullable(),
  servicios_realizados_text: z.string().optional().nullable(),
  estado_text: groomingEstadoSchema.optional().default("pendiente"),
});

export type GuardarGroomingInput = z.infer<typeof guardarGroomingSchema>;
