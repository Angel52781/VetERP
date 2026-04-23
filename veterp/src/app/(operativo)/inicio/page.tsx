import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import { getDashboardMetrics } from "./actions";
import { Calendar, DollarSign, Activity } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const clinicaId = await getClinicaIdFromCookies();

  const { data: clinica } = clinicaId
    ? await supabase
        .from("clinicas")
        .select("id,nombre")
        .eq("id", clinicaId)
        .single()
    : { data: null };

  const { data: metrics } = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          {clinica ? clinica.nombre : "Clínica no seleccionada"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Citas de Hoy
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.citasHoy ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Agendadas para el día de hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Día
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {(metrics?.ingresosHoy ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de pagos registrados hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes Abiertas
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.ordenesAbiertas ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En proceso o en espera
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
