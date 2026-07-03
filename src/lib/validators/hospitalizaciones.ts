import { z } from "zod";

const optionalText = (max = 1000) =>
  z
    .string()
    .max(max, `No debe superar ${max} caracteres`)
    .optional()
    .nullable();

const optionalTrimmedText = (max = 1000) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    z
      .string()
      .max(max, `No debe superar ${max} caracteres`)
      .optional()
      .nullable(),
  );

const optionalOrdenTratamiento = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  },
  z
    .number({
      message: "El orden debe ser un numero valido",
    })
    .int("El orden debe ser un numero entero")
    .min(0, "El orden no puede ser menor a 0")
    .max(999, "El orden no puede ser mayor a 999")
    .optional(),
);


const optionalPercent = z
  .number({
    message: "La deshidratación debe ser un número válido",
  })
  .min(0, "La deshidratación no puede ser menor a 0")
  .max(100, "La deshidratación no puede ser mayor a 100")
  .optional();

export const hospitalizacionEstadoValues = ["activa", "alta", "cancelada"] as const;
export const tratamientoEstadoValues = ["activo", "terminado", "suspendido"] as const;

export const tratamientoEstadoSchema = z.enum(tratamientoEstadoValues);

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
  temperatura_num: z.number({ message: "La temperatura debe ser un numero valido" }).min(30, "Mínimo 30 °C").max(45, "Máximo 45 °C").optional(),
  frecuencia_cardiaca_num: z.number({ message: "La frecuencia cardiaca debe ser un numero valido" }).min(30, "Mínimo 30 lpm").max(300, "Máximo 300 lpm").optional(),
  frecuencia_respiratoria_num: z.number({ message: "La frecuencia respiratoria debe ser un numero valido" }).min(5, "Mínimo 5 rpm").max(120, "Máximo 120 rpm").optional(),
  peso_num: z.number({ message: "El peso debe ser un numero valido" }).min(0.1, "Mínimo 0.1 kg").max(150, "Máximo 150 kg").optional(),
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

export const createTratamientoHospitalizacionSchema = z.object({
  hospitalizacion_id: z.string().uuid("ID de hospitalizacion invalido"),
  mascota_id: z.string().uuid("ID de paciente invalido"),
  nombre_text: z
    .string()
    .trim()
    .min(2, "El tratamiento debe tener al menos 2 caracteres")
    .max(160, "El tratamiento no debe superar 160 caracteres"),
  dosis_text: optionalTrimmedText(160),
  via_text: optionalTrimmedText(120),
  frecuencia_text: optionalTrimmedText(120),
  indicaciones_text: optionalTrimmedText(1000),
  responsable_text: optionalTrimmedText(160),
  notas_text: optionalTrimmedText(1000),
  orden_num: optionalOrdenTratamiento,
});

export const updateTratamientoHospitalizacionSchema =
  createTratamientoHospitalizacionSchema.extend({
    id: z.string().uuid("ID de tratamiento invalido"),
  });

export const cambiarEstadoTratamientoHospitalizacionSchema = z.object({
  id: z.string().uuid("ID de tratamiento invalido"),
  hospitalizacion_id: z.string().uuid("ID de hospitalizacion invalido"),
  mascota_id: z.string().uuid("ID de paciente invalido"),
  notas_text: optionalTrimmedText(1000),
});

export type CreateHospitalizacionInput = z.infer<typeof createHospitalizacionSchema>;
export type CreateHospitalizacionControlInput = z.infer<typeof createHospitalizacionControlSchema>;
export type AltaHospitalizacionInput = z.infer<typeof altaHospitalizacionSchema>;
export type CreateTratamientoHospitalizacionInput = z.infer<typeof createTratamientoHospitalizacionSchema>;
export type UpdateTratamientoHospitalizacionInput = z.infer<typeof updateTratamientoHospitalizacionSchema>;
export type CambiarEstadoTratamientoHospitalizacionInput = z.infer<
  typeof cambiarEstadoTratamientoHospitalizacionSchema
>;
export type HospitalizacionEstado = (typeof hospitalizacionEstadoValues)[number];
export type TratamientoEstado = (typeof tratamientoEstadoValues)[number];
