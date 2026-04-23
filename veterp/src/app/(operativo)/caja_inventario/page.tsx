import { getVentasResumen, getInventario } from "./actions";
import { getAlmacenes } from "../ajustes/actions";
import { getUserRole } from "@/lib/clinica";
import { VentasList } from "./ventas-list";
import { InventarioList } from "./inventario-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function CajaInventarioPage() {
  const [role, ventasRes, invRes, almacenesRes] = await Promise.all([
    getUserRole(),
    getVentasResumen(),
    getInventario(),
    getAlmacenes()
  ]);

  const isVeterinario = role === "veterinario";

  const ventas = ventasRes.data || [];
  const inventario = invRes.data || [];
  const almacenes = almacenesRes.data || [];

  if (ventasRes.error) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-500">Error cargando caja: {ventasRes.error}</p>
      </div>
    );
  }

  // Calculate metrics
  const totalVentas = ventas?.length || 0;
  const ventasAbiertas = ventas?.filter(v => v.estado !== "pagada").length || 0;
  
  const ingresosTotales = ventas?.reduce((acc: number, venta: any) => {
    const pagado = venta.ledger?.reduce((pAcc: number, p: any) => pAcc + Number(p.monto), 0) || 0;
    return acc + pagado;
  }, 0) || 0;

  const montoPorCobrar = ventas?.reduce((acc: number, venta: any) => {
    if (venta.estado === "pagada") return acc;
    const pagado = venta.ledger?.reduce((pAcc: number, p: any) => pAcc + Number(p.monto), 0) || 0;
    return acc + Math.max(0, Number(venta.total) - pagado);
  }, 0) || 0;

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-full px-4 md:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Caja e Inventario</h1>
        <p className="text-muted-foreground mt-1">Gestión de ingresos, cuentas por cobrar y stock de productos.</p>
      </div>

      <Tabs defaultValue={isVeterinario ? "inventario" : "caja"} className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-flex">
          {!isVeterinario && <TabsTrigger value="caja">Caja y Ventas</TabsTrigger>}
          <TabsTrigger value="inventario">Inventario / Kardex</TabsTrigger>
        </TabsList>

        {!isVeterinario && (
          <TabsContent value="caja" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales (Cobrado)</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(ingresosTotales)}</div>
                <p className="text-xs text-muted-foreground">Total en caja</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{formatCurrency(montoPorCobrar)}</div>
                <p className="text-xs text-muted-foreground">De {ventasAbiertas} ventas abiertas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ventas Registradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVentas}</div>
                <p className="text-xs text-muted-foreground">Histórico total</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>Lista de todas las ventas y sus estados de pago.</CardDescription>
            </CardHeader>
            <CardContent>
              <VentasList ventas={ventas || []} />
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="inventario" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventario / Kardex</CardTitle>
              <CardDescription>Control de stock y movimientos manuales de productos.</CardDescription>
            </CardHeader>
            <CardContent>
              <InventarioList inventario={inventario} almacenes={almacenes} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}