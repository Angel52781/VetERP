import { z } from "zod";

export const tipoDocumentoClienteValues = ["dni", "ce", "pasaporte", "ruc", "otro"] as const;

export const tipoDocumentoClienteLabels: Record<(typeof tipoDocumentoClienteValues)[number], string> = {
  dni: "DNI",
  ce: "CE",
  pasaporte: "Pasaporte",
  ruc: "RUC",
  otro: "Otro",
};

const optionalTrimmedString = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || undefined);

const optionalTipoDocumentoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || tipoDocumentoClienteValues.includes(value as any), {
    message: "Tipo de documento invalido.",
  });

export const clienteSchema = z.object({
  nombre: z.string().trim().min(2),
  telefono: optionalTrimmedString(80, "El telefono debe tener 80 caracteres o menos."),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Email invalido.",
    }),
  tipo_documento_text: optionalTipoDocumentoSchema,
  numero_documento_text: optionalTrimmedString(80, "El numero de documento debe tener 80 caracteres o menos."),
  direccion_principal_text: optionalTrimmedString(300, "La direccion debe tener 300 caracteres o menos."),
  referencia_direccion_text: optionalTrimmedString(300, "La referencia debe tener 300 caracteres o menos."),
}).superRefine((data, ctx) => {
  if (data.tipo_documento_text && !data.numero_documento_text) {
    ctx.addIssue({
      code: "custom",
      path: ["numero_documento_text"],
      message: "Ingresa el numero de documento.",
    });
  }

  if (data.numero_documento_text && !data.tipo_documento_text) {
    ctx.addIssue({
      code: "custom",
      path: ["tipo_documento_text"],
      message: "Selecciona el tipo de documento.",
    });
  }
});

export type ClienteFormValues = z.input<typeof clienteSchema>;

export function formatTipoDocumentoLabel(tipoDocumento?: string | null) {
  const tipo = tipoDocumento?.trim().toLowerCase() as (typeof tipoDocumentoClienteValues)[number] | undefined;

  if (!tipo || !tipoDocumentoClienteValues.includes(tipo)) return "Sin documento";

  return tipoDocumentoClienteLabels[tipo];
}

export function formatClienteDocumento(tipoDocumento?: string | null, numeroDocumento?: string | null) {
  const tipo = tipoDocumento?.trim().toLowerCase() as (typeof tipoDocumentoClienteValues)[number] | undefined;
  const numero = numeroDocumento?.trim();

  if (!tipo || !numero || !tipoDocumentoClienteValues.includes(tipo)) return null;

  return `${formatTipoDocumentoLabel(tipo)} ${numero}`;
}

export const mascotaSchema = z.object({
  nombre: z.string().min(1),
  codigo_text: z
    .string()
    .trim()
    .max(50, "El codigo debe tener 50 caracteres o menos.")
    .optional()
    .nullable(),
  especie: z.string().optional(),
  raza: z.string().optional(),
  nacimiento: z.string().optional(),
  alertas_criticas: z.string().optional().nullable(),
  notas_manejo: z.string().optional().nullable(),
});

export type MascotaFormValues = z.infer<typeof mascotaSchema>;
