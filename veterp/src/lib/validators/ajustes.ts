import { z } from "zod";

export const itemCatalogoSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
  kind: z.enum(["producto", "servicio"], { message: "Selecciona el tipo de ítem" }),
  precio_inc: z.coerce.number().min(0, { message: "El precio no puede ser negativo" }),
  proveedor_id: z.string().uuid().optional().nullable(),
  categoria_id: z.string().uuid().optional().nullable(),
  is_disabled: z.boolean().optional(),
});

export type ItemCatalogoInput = z.infer<typeof itemCatalogoSchema>;

export const categoriaSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;

export const proveedorSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
});

export type ProveedorInput = z.infer<typeof proveedorSchema>;

export const almacenSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  ubicacion: z.string().optional(),
  is_default: z.boolean().optional(),
});

export type AlmacenInput = z.infer<typeof almacenSchema>;

export const movimientoStockSchema = z.object({
  item_id: z.string().uuid(),
  almacen_id: z.string().uuid(),
  qty: z.coerce.number(),
  tipo: z.string().min(1),
  notas: z.string().optional(),
});

export type MovimientoStockInput = z.infer<typeof movimientoStockSchema>;

export const clinicaBrandingSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre comercial debe tener al menos 2 caracteres" }),
  razon_social: z.string().optional().nullable(),
  ruc: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email({ message: "Email inválido" }).optional().nullable().or(z.literal("")),
  direccion: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
});

export type ClinicaBrandingInput = z.infer<typeof clinicaBrandingSchema>;

