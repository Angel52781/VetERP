import { z } from "zod";

const optionalText = (max = 1000) =>
  z
    .string()
    .max(max, `No debe superar ${max} caracteres`)
    .optional()
    .nullable();

const optionalPositiveNumber = (label: string) =>
  z
    .number({
      message: `${label} debe ser un numero valido`,
    })
    .positive(`${label} debe ser mayor a 0`)
    .optional();

const optionalPercent = z
  .number({
    message: "La deshidratación debe ser un número válido",
  })
  .min(0, "La deshidratación no puede ser menor a 0")
  .max(100, "La deshidratación no puede ser mayor a 100")
  .optional();

export const hospitalizacionEstadoValues = ["activa", "alta", "cancelada"] as const;

export const createHospitalizacionSchema = z.object({
  mascota_id: z.string().uuid("ID de paciente invalido"),
  cliente_id: z.string().uuid("ID de responsable invalido"),
  medico_tratante_text: optionalText(160),
  motivo_text: z
    .string()
    .trim()
    .min(2, "El motivo debe tener al menos 2 caracteres")
    .max(500, "El motivo no debe superar 500 caracteres"),
  diagnostico_presuntivo_text: optionalText(1000),
});

export const createHospitalizacionControlSchema = z.object({
  hospitalizacion_id: z.string().uuid("ID de hospitalización inválido"),
  mascota_id: z.string().uuid("ID de paciente invalido"),
  temperatura_num: optionalPositiveNumber("La temperatura"),
  frecuencia_cardiaca_num: optionalPositiveNumber("La frecuencia cardiaca"),
  frecuencia_respiratoria_num: optionalPositiveNumber("La frecuencia respiratoria"),
  peso_num: optionalPositiveNumber("El peso"),
  deshidratacion_pct: optionalPercent,
  mucosas_text: optionalText(160),
  tlc_text: optionalText(160),
  comio_bool: z.boolean().optional(),
  orino_bool: z.boolean().optional(),
  defeco_bool: z.boolean().optional(),
  observaciones_text: optionalText(1500),
});

export const altaHospitalizacionSchema = z.object({
  id: z.string().uuid("ID de hospitalización inválido"),
  alta_notas_text: optionalText(1500),
});

export type CreateHospitalizacionInput = z.infer<typeof createHospitalizacionSchema>;
export type CreateHospitalizacionControlInput = z.infer<typeof createHospitalizacionControlSchema>;
export type AltaHospitalizacionInput = z.infer<typeof altaHospitalizacionSchema>;
export type HospitalizacionEstado = (typeof hospitalizacionEstadoValues)[number];
