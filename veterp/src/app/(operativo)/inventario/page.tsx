import { getProductosInventario } from "./actions";
import { getAlmacenes, getProveedores, getCategorias } from "../ajustes/actions";
import { InventarioClient } from "./inventario-client";
import { Package } from "lucide-react";

export const metadata = {
  title: "Inventario | VetERP",
  description: "Control de stock y movimientos de productos veterinarios",
};

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const [productosRes, almacenesRes, proveedoresRes, categoriasRes] = await Promise.all([
    getProductosInventario(),
    getAlmacenes(),
    getProveedores(),
    getCategorias(),
  ]);

  if (productosRes.error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Error al cargar inventario: {productosRes.error}
        </div>
      </div>
    );
  }

  const productos = productosRes.data;
  const almacenes = almacenesRes.data ?? [];
  const proveedores = proveedoresRes.data ?? [];
  const categorias = categoriasRes.data ?? [];

  const sinAlmacen = almacenes.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Inventario
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control de stock, movimientos y Kardex de productos veterinarios.
          </p>
        </div>
      </div>

      {sinAlmacen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Sin almacén configurado.</strong> Ve a <strong>Ajustes → Almacenes</strong> y crea al menos uno para poder registrar movimientos de stock.
        </div>
      )}

      <InventarioClient
        productos={productos}
        almacenes={almacenes}
        proveedores={proveedores}
        categorias={categorias}
      />
    </div>
  );
}
