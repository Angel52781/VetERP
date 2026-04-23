import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import { getDashboardMetrics } from "./actions";
import { Calendar, DollarSign, Activity, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Citas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.citasData && metrics.citasData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Mascota</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.citasData.map((cita: any) => (
                    <TableRow key={cita.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(cita.start_date), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        {cita.clientes?.nombre} {cita.clientes?.apellidos}
                      </TableCell>
                      <TableCell>{cita.mascotas?.nombre}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: cita.tipo_citas?.color || "#ccc",
                            color: cita.tipo_citas?.color || "inherit",
                          }}
                        >
                          {cita.tipo_citas?.nombre}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No hay citas programadas para hoy.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Órdenes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.ordenesRecientes && metrics.ordenesRecientes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Mascota</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.ordenesRecientes.map((orden: any) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(orden.created_at), "dd MMM HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {orden.clientes?.nombre} {orden.clientes?.apellidos}
                      </TableCell>
                      <TableCell>{orden.mascotas?.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={orden.estado_text === "finished" ? "default" : "secondary"}>
                          {orden.estado_text}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No hay órdenes recientes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
