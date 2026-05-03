import { z } from "zod";

export const tipoCitaSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  duracion_min: z.number().min(1, { message: "La duración debe ser de al menos 1 minuto" }),
  color: z.string().min(4, { message: "El color no es válido" }),
  area: z.enum(["clinica", "banos", "grooming", "cirugia", "movilidad", "otro"]).default("clinica"),
  is_disabled: z.boolean().optional(),
});

export const citaSchema = z.object({
  cliente_id: z.string().uuid({ message: "ID de cliente inválido" }),
  mascota_id: z.string().uuid({ message: "ID de mascota inválido" }),
  tipo_cita_id: z.string().uuid({ message: "ID de tipo de cita inválido" }),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida" }),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida" }),
});

export type TipoCitaInput = z.input<typeof tipoCitaSchema>;
export type CitaInput = z.infer<typeof citaSchema>;
