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
