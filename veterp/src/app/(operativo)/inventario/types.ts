// Tipos compartidos entre Server y Client del módulo de Inventario
export interface ProductoInventario {
  id: string;
  nombre: string;
  descripcion: string | null;
  kind: "producto" | "servicio";
  sku: string | null;
  unidad: string;
  precio_inc: number;
  costo_referencial: number | null;
  stock_minimo: number;
  is_disabled: boolean;
  proveedor_id: string | null;
  categoria_id: string | null;
  proveedores: { nombre: string } | null;
  categorias_catalogo: { nombre: string } | null;
  stock: number;
}

export interface MovimientoKardex {
  id: string;
  tipo: string;
  qty: number;
  stock_anterior: number | null;
  stock_nuevo: number | null;
  motivo: string | null;
  notas: string | null;
  lote: string | null;
  fecha_vencimiento: string | null;
  created_at: string;
  almacenes: { nombre: string } | null;
}

export const MOTIVO_MOVIMIENTO_LABELS: Record<string, string> = {
  compra_proveedor: "Compra a proveedor",
  devolucion: "Devolución",
  correccion_positiva: "Corrección positiva",
  uso_clinico: "Uso clínico",
  venta: "Venta",
  merma_perdida: "Merma / pérdida",
  correccion_negativa: "Corrección negativa",
  otro: "Otro",
  inventario_inicial: "Inventario inicial",
  reversion_venta: "Reversión de venta",
};

export function formatMotivoMovimiento(motivo: string | null) {
  if (!motivo) return null;
  return MOTIVO_MOVIMIENTO_LABELS[motivo] ?? motivo;
}
