import { z } from "zod";

export const citaAreaSchema = z.enum(["clinica", "banos", "grooming", "cirugia", "movilidad", "otro"]);

export const tipoCitaSchema = z.object({
  nombre: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  duracion_min: z.number().int().min(1, { message: "La duracion debe ser de al menos 1 minuto" }),
  color: z.string().trim().min(4, { message: "El color no es valido" }).optional().nullable(),
  area: citaAreaSchema,
  is_disabled: z.boolean().optional(),
});

export const tipoCitaUpdateSchema = tipoCitaSchema.pick({
  nombre: true,
  duracion_min: true,
  color: true,
  area: true,
});

export const tipoCitaDisabledSchema = z.object({
  disabled: z.boolean(),
});

export const citaSchema = z.object({
  cliente_id: z.string().uuid({ message: "ID de cliente invalido" }),
  mascota_id: z.string().uuid({ message: "ID de mascota invalido" }),
  tipo_cita_id: z.string().uuid({ message: "ID de tipo de cita invalido" }),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de inicio invalida" }),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de fin invalida" }),
});

export type TipoCitaInput = z.input<typeof tipoCitaSchema>;
export type TipoCitaUpdateInput = z.input<typeof tipoCitaUpdateSchema>;
export type TipoCitaDisabledInput = z.input<typeof tipoCitaDisabledSchema>;
export type CitaInput = z.infer<typeof citaSchema>;
