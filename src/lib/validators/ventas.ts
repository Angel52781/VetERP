import { z } from "zod";

export const itemCatalogoSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  kind: z.enum(["producto", "servicio"]),
  precio_inc: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  is_disabled: z.boolean().default(false),
  proveedor_id: z.string().uuid().optional().nullable(),
});

export type ItemCatalogoInput = z.infer<typeof itemCatalogoSchema>;

export const ventaSchema = z.object({
  id: z.string().uuid().optional(),
  cliente_id: z.string().uuid("El cliente es requerido"),
  orden_id: z.string().uuid().optional().nullable(),
  estado: z.enum(["abierta", "pagada", "anulada"]).default("abierta"),
  total: z.coerce.number().min(0).default(0),
});

export type VentaInput = z.infer<typeof ventaSchema>;

export const itemVentaSchema = z.object({
  id: z.string().uuid().optional(),
  venta_id: z.string().uuid("La venta es requerida"),
  item_id: z.string().uuid("El ítem es requerido"),
  cantidad: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
  precio_unitario: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
});

export type ItemVentaInput = z.infer<typeof itemVentaSchema>;

export const ledgerSchema = z.object({
  id: z.string().uuid().optional(),
  cliente_id: z.string().uuid("El cliente es requerido"),
  venta_id: z.string().uuid().optional().nullable(),
  orden_id: z.string().uuid().optional().nullable(),
  tipo: z.enum(["pago", "cargo", "reembolso"]),
  monto: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  metodo_pago: z.enum(["efectivo", "tarjeta", "transferencia"]).optional().nullable(),
  fecha: z.string().optional(),
});

export type LedgerInput = z.infer<typeof ledgerSchema>;

export const abrirCajaSchema = z.object({
  monto_apertura: z.coerce.number().min(0, "El monto de apertura no puede ser negativo"),
});

export type AbrirCajaInput = z.infer<typeof abrirCajaSchema>;

export const cerrarCajaSchema = z.object({
  monto_cierre_efectivo_real: z.coerce.number().min(0, "El monto real no puede ser negativo"),
  notas: z.string().optional().nullable(),
});

export type CerrarCajaInput = z.infer<typeof cerrarCajaSchema>;
