import { z } from "zod";

export const itemCatalogoSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
  kind: z.enum(["producto", "servicio"], { message: "Selecciona el tipo de ítem" }),
  precio_inc: z.coerce.number().min(0, { message: "El precio no puede ser negativo" }),
  proveedor_id: z.string().uuid().optional().nullable(),
  is_disabled: z.boolean().optional(),
});

export type ItemCatalogoInput = z.infer<typeof itemCatalogoSchema>;

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

