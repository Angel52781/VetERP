import { z } from "zod";

export const tipoAdjuntoMascotaValues = ["examen", "foto", "receta", "documento", "otro"] as const;
export const MASCOTA_ADJUNTO_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_MASCOTA_ADJUNTO_BYTES = 10 * 1024 * 1024;

const optionalTrimmedText = (max = 1000) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    z.string().max(max, `No debe superar ${max} caracteres`).optional().nullable(),
  );

const fileLikeSchema = z
  .custom<File>(
    (value) =>
      typeof value === "object" &&
      value !== null &&
      "name" in value &&
      "type" in value &&
      "size" in value &&
      typeof (value as File).name === "string" &&
      typeof (value as File).type === "string" &&
      typeof (value as File).size === "number",
    "Selecciona un archivo valido",
  )
  .refine((file) => MASCOTA_ADJUNTO_MIME_TYPES.includes(file.type as any), {
    message: "Formato no permitido. Usa PDF, JPG, PNG o WEBP.",
  })
  .refine((file) => file.size <= MAX_MASCOTA_ADJUNTO_BYTES, {
    message: "El archivo no debe superar 10MB.",
  });

export const tipoAdjuntoMascotaSchema = z.enum(tipoAdjuntoMascotaValues);

export const subirAdjuntoMascotaSchema = z.object({
  mascota_id: z.string().uuid("ID de paciente invalido"),
  tipo_text: tipoAdjuntoMascotaSchema,
  notas_text: optionalTrimmedText(1000),
  file: fileLikeSchema,
});

export const updateMetadataAdjuntoMascotaSchema = z.object({
  id: z.string().uuid("ID de adjunto invalido"),
  tipo_text: tipoAdjuntoMascotaSchema,
  notas_text: optionalTrimmedText(1000),
});

export type TipoAdjuntoMascota = (typeof tipoAdjuntoMascotaValues)[number];
export type SubirAdjuntoMascotaInput = z.infer<typeof subirAdjuntoMascotaSchema>;
export type UpdateMetadataAdjuntoMascotaInput = z.infer<typeof updateMetadataAdjuntoMascotaSchema>;
