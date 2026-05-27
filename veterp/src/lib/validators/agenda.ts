import { z } from "zod";

export const citaAreaSchema = z.enum(["clinica", "banos", "grooming", "cirugia", "movilidad", "otro"]);

const nullableTrimmedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable()
    .transform((value) => (typeof value === "string" && value.length > 0 ? value : null));

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
  notas_text: z.string().max(1000, "Las notas de cita no deben superar 1000 caracteres").optional().nullable(),
  movilidad_usa_direccion_cliente: z.boolean().optional().default(false),
  movilidad_direccion_text: nullableTrimmedText(300, "La direccion de movilidad no debe superar 300 caracteres"),
  movilidad_referencia_text: nullableTrimmedText(300, "La referencia de movilidad no debe superar 300 caracteres"),
});

export type CitaMovilidadPayload = {
  movilidad_usa_direccion_cliente: boolean;
  movilidad_direccion_text: string | null;
  movilidad_referencia_text: string | null;
};

type ResolveCitaMovilidadInput = {
  movilidad_usa_direccion_cliente?: boolean | null;
  movilidad_direccion_text?: string | null;
  movilidad_referencia_text?: string | null;
};

type ResolveCitaMovilidadOptions = {
  isMovilidad: boolean;
  clienteDireccion?: string | null;
  clienteReferencia?: string | null;
};

function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveCitaMovilidadFields(
  input: ResolveCitaMovilidadInput,
  options: ResolveCitaMovilidadOptions,
): { error: string | null; data: CitaMovilidadPayload | null } {
  if (!options.isMovilidad) {
    return {
      error: null,
      data: {
        movilidad_usa_direccion_cliente: false,
        movilidad_direccion_text: null,
        movilidad_referencia_text: null,
      },
    };
  }

  const movilidadUsaDireccionCliente = Boolean(input.movilidad_usa_direccion_cliente);
  const manualDireccion = normalizeNullableText(input.movilidad_direccion_text);
  const manualReferencia = normalizeNullableText(input.movilidad_referencia_text);

  if (movilidadUsaDireccionCliente) {
    const clienteDireccion = normalizeNullableText(options.clienteDireccion);

    if (!clienteDireccion) {
      return {
        error: "El responsable no tiene direccion registrada. Ingresa una direccion manual.",
        data: null,
      };
    }

    return {
      error: null,
      data: {
        movilidad_usa_direccion_cliente: true,
        movilidad_direccion_text: clienteDireccion,
        movilidad_referencia_text: manualReferencia ?? normalizeNullableText(options.clienteReferencia),
      },
    };
  }

  if (!manualDireccion) {
    return {
      error: "Ingresa una direccion de movilidad o usa la direccion del responsable.",
      data: null,
    };
  }

  return {
    error: null,
    data: {
      movilidad_usa_direccion_cliente: false,
      movilidad_direccion_text: manualDireccion,
      movilidad_referencia_text: manualReferencia,
    },
  };
}

export type TipoCitaInput = z.input<typeof tipoCitaSchema>;
export type TipoCitaUpdateInput = z.input<typeof tipoCitaUpdateSchema>;
export type TipoCitaDisabledInput = z.input<typeof tipoCitaDisabledSchema>;
export type CitaInput = z.input<typeof citaSchema>;
