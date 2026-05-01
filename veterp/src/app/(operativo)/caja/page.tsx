import { getVentasResumen, getCierreActual, getCierresHistorial } from "../caja_inventario/actions";
import { getUserRole, requireClinicaIdFromCookies } from "@/lib/clinica";
import { VentasList } from "../caja_inventario/ventas-list";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle, Receipt, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CorteCajaClient } from "./corte-caja-client";
import { createClient } from "@/lib/supabase/server";
import { formatMoneyPEN } from "@/lib/money";

export const metadata = {
  title: "Caja | VetERP",
  description: "Gestión de ingresos y cuentas por cobrar",
};

export default async function CajaPage() {
  const role = await getUserRole();

  if (role === "veterinario" || role === "asistente") {
    redirect("/inventario");
  }

  const [ventasRes, cierreRes, historialRes] = await Promise.all([
    getVentasResumen(),
    getCierreActual(),
    getCierresHistorial(),
  ]);

  const ventas = ventasRes.data || [];
  const cierreActual = cierreRes.data;
  const historial = historialRes.data || [];

  if (ventasRes.error) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-500">Error cargando caja: {ventasRes.error}</p>
      </div>
    );
  }

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

  // Resumen de la sesión actual (pagos no vinculados a un cierre) filtrado por clínica
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();
  const { data: pagosSinCierre } = await supabase
    .from("ledger")
    .select("monto, metodo_pago")
    .eq("clinica_id", clinicaId)
    .eq("tipo", "pago")
    .is("cierre_id", null);

  const resumenActual = {
    efectivo: pagosSinCierre?.filter(p => p.metodo_pago === "efectivo").reduce((a, b) => a + Number(b.monto), 0) || 0,
    tarjeta: pagosSinCierre?.filter(p => p.metodo_pago === "tarjeta").reduce((a, b) => a + Number(b.monto), 0) || 0,
    transferencia: pagosSinCierre?.filter(p => p.metodo_pago === "transferencia").reduce((a, b) => a + Number(b.monto), 0) || 0,
    total: pagosSinCierre?.reduce((a, b) => a + Number(b.monto), 0) || 0,
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Caja y Ventas</h1>
        <p className="text-muted-foreground mt-1">Gestión de ingresos, cuentas por cobrar y flujo de caja.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales (Cobrado)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoneyPEN(ingresosTotales)}</div>
            <p className="text-xs text-muted-foreground">Total en caja</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatMoneyPEN(montoPorCobrar)}</div>
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

      <Tabs defaultValue="corte" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="corte" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Corte de Caja
          </TabsTrigger>
          <TabsTrigger value="ventas" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Ventas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="corte" className="mt-6">
          <CorteCajaClient 
            cierreActual={cierreActual} 
            resumenActual={resumenActual}
            historial={historial}
          />
        </TabsContent>

        <TabsContent value="ventas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>Lista de todas las ventas y sus estados de pago.</CardDescription>
            </CardHeader>
            <CardContent>
              <VentasList ventas={ventas} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
