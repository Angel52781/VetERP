import { getInventario } from "../caja_inventario/actions";
import { getAlmacenes } from "../ajustes/actions";
import { InventarioList } from "../caja_inventario/inventario-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = {
  title: "Inventario | VetERP",
  description: "Gestión de inventario y Kardex",
};

export default async function InventarioPage() {
  const [invRes, almacenesRes] = await Promise.all([
    getInventario(),
    getAlmacenes(),
  ]);

  const inventario = invRes.data || [];
  const almacenes = almacenesRes.data || [];

  if (invRes.error) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-500">Error cargando inventario: {invRes.error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventario y Kardex</h1>
        <p className="text-muted-foreground mt-1">Control de stock y movimientos de productos de la clínica.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardDescription>Control de stock y registro de entradas y salidas.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventarioList inventario={inventario} almacenes={almacenes} />
        </CardContent>
      </Card>
    </div>
  );
}
