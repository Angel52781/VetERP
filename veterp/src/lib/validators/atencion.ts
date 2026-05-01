import { z } from "zod";

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

export type OrdenServicioInput = z.infer<typeof ordenServicioSchema>;
export type EntradaClinicaInput = z.infer<typeof entradaClinicaSchema>;
export type SignosVitalesInput = z.infer<typeof signosVitalesSchema>;
export type AdjuntoInput = z.infer<typeof adjuntoSchema>;

