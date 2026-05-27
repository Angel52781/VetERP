import { z } from "zod";

const optionalTrimmedText = (max = 2000) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    z.string().max(max, `No debe superar ${max} caracteres`).optional().nullable(),
  );

const optionalPositiveNumber = (label: string, max: number) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return Number(value);
    },
    z
      .number({ message: `${label} debe ser un numero valido` })
      .positive(`${label} debe ser mayor a 0`)
      .max(max, `${label} no debe superar ${max}`)
      .optional(),
  );

const optionalNumberRange = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return Number(value);
    },
    z
      .number({ message: `${label} debe ser un numero valido` })
      .min(min, `${label} no puede ser menor a ${min}`)
      .max(max, `${label} no puede ser mayor a ${max}`)
      .optional(),
  );

const optionalIntegerRange = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return Number(value);
    },
    z
      .number({ message: `${label} debe ser un numero valido` })
      .int(`${label} debe ser un numero entero`)
      .min(min, `${label} no puede ser menor a ${min}`)
      .max(max, `${label} no puede ser mayor a ${max}`)
      .optional(),
  );

export const ordenServicioSchema = z.object({
  cliente_id: z.string().uuid("ID de cliente inválido"),
  mascota_id: z.string().uuid("ID de mascota inválido"),
});

export const entradaClinicaSchema = z.object({
  orden_id: z.string().uuid("ID de orden inválido"),
  // Campos de texto libre legacy (siguen siendo requeridos para notas de evolución)
  tipo_text: z.string().min(1, "El tipo es requerido"),
  texto_text: z.string().default(""),
  // Campos clínicos estructurados — todos opcionales para retrocompatibilidad
  motivo_consulta_text:          z.string().optional(),
  peso_kg_num:                   z.number().positive().max(999).optional(),
  temperatura_c_num:             z.number().min(0).max(60).optional(),
  frecuencia_cardiaca_num:       z.number().int().min(1).max(500).optional(),
  frecuencia_respiratoria_num:   z.number().int().min(1).max(200).optional(),
  observaciones_text:            z.string().optional(),
  diagnostico_text:              z.string().optional(),
  anamnesis_text:                z.string().optional(),
  plan_tratamiento_text:         z.string().optional(),
});

export const signosVitalesSchema = z.object({
  orden_id: z.string().uuid("ID de orden inválido"),
  motivo_consulta_text:          z.string().optional(),
  peso_kg_num:                   z.number().positive().max(999).optional(),
  temperatura_c_num:             z.number().min(0).max(60).optional(),
  frecuencia_cardiaca_num:       z.number().int().min(1).max(500).optional(),
  frecuencia_respiratoria_num:   z.number().int().min(1).max(200).optional(),
  observaciones_text:            z.string().optional(),
  diagnostico_text:              z.string().optional(),
  anamnesis_text:                z.string().optional(),
  plan_tratamiento_text:         z.string().optional(),
});

export const adjuntoSchema = z.object({
  orden_id: z.string().uuid("ID de orden inválido"),
  archivo_url: z.string(), // changed from z.string().url() since it's a relative path now
  descripcion_text: z.string().optional(),
});

export const editarEntradaClinicaSchema = z.object({
  id: z.string().uuid("ID de entrada clinica invalido"),
  tipo_text: z
    .string()
    .trim()
    .min(1, "El tipo es requerido")
    .max(120, "El tipo no debe superar 120 caracteres"),
  texto_text: optionalTrimmedText(8000),
  motivo_consulta_text: optionalTrimmedText(500),
  peso_kg_num: optionalPositiveNumber("El peso", 999),
  temperatura_c_num: optionalNumberRange("La temperatura", 0, 60),
  frecuencia_cardiaca_num: optionalIntegerRange("La frecuencia cardiaca", 1, 500),
  frecuencia_respiratoria_num: optionalIntegerRange("La frecuencia respiratoria", 1, 200),
  observaciones_text: optionalTrimmedText(4000),
  diagnostico_text: optionalTrimmedText(2000),
  anamnesis_text: optionalTrimmedText(4000),
  plan_tratamiento_text: optionalTrimmedText(4000),
  motivo_edicion_text: z
    .string()
    .trim()
    .min(5, "El motivo de edicion debe tener al menos 5 caracteres")
    .max(500, "El motivo de edicion no debe superar 500 caracteres"),
});

export type OrdenServicioInput = z.infer<typeof ordenServicioSchema>;
export type EntradaClinicaInput = z.infer<typeof entradaClinicaSchema>;
export type SignosVitalesInput = z.infer<typeof signosVitalesSchema>;
export type AdjuntoInput = z.infer<typeof adjuntoSchema>;
export type EditarEntradaClinicaInput = z.infer<typeof editarEntradaClinicaSchema>;
