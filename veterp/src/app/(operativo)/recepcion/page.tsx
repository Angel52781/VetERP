import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  ClipboardList,
  Users,
  PawPrint,
  CalendarDays,
  UserPlus,
  Clock,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import { getCombinedOperationalStatus, getFinancialStatusMeta, getOrdenStatusMeta } from "@/lib/operational-status";
import { getClientesParaAgenda } from "@/app/(operativo)/agenda/actions";
import { getOrdenesServicio } from "@/app/(operativo)/index/actions";
import { NuevaAtencionForm } from "@/app/(operativo)/index/nueva-atencion-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recepción | VetERP",
  description: "Ingreso de pacientes y operación diaria",
};

export default async function RecepcionPage() {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const hoy = new Date();
  const inicioHoy = startOfDay(hoy).toISOString();
  const finHoy = endOfDay(hoy).toISOString();

  // Citas programadas para hoy (estado programada o confirmada)
  const { data: citasHoy } = await supabase
    .from("citas")
    .select(
       `id, start_date, end_date, estado,
       clientes:cliente_id (nombre),
       mascotas:mascota_id (id, nombre, codigo_text, alertas_criticas),
       tipo_citas:tipo_cita_id (nombre, color)`
    )
    .eq("clinica_id", clinicaId)
    .in("estado", ["programada", "confirmada", "llego"])
    .gte("start_date", inicioHoy)
    .lte("start_date", finHoy)
    .order("start_date", { ascending: true });

  const [{ data: ordenes }, { data: clientes }] = await Promise.all([
    getOrdenesServicio(),
    getClientesParaAgenda(),
  ]);

  const ordenesActivas = ordenes ?? [];
  const enEspera = ordenesActivas.filter((o) => o.estado_text === "open");
  const enAtencion = ordenesActivas.filter((o) => o.estado_text === "in_progress");

  const ordenActivaByMascotaId = new Map<string, any>();
  for (const orden of ordenesActivas) {
    const mascotaId = orden?.mascotas?.id;
    if (!mascotaId) continue;
    const current = ordenActivaByMascotaId.get(mascotaId);
    if (!current || (current.estado_text !== "in_progress" && orden.estado_text === "in_progress")) {
      ordenActivaByMascotaId.set(mascotaId, orden);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Recepción</h1>
          <p className="text-sm text-muted-foreground">
            Ingreso de pacientes, walk-ins y accesos rápidos del día —{" "}
            {format(hoy, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        {/* Botón principal */}
        {clientes && (
          <NuevaAtencionForm
            clientes={clientes}
            triggerLabel="Nuevo ingreso"
            triggerVariant="default"
          />
        )}
      </div>

      {/* Resumen rápido */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Programados hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(citasHoy ?? []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-medium">En espera</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{enEspera.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">En atención</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{enAtencion.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/clientes"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Buscar cliente</p>
              <p className="text-xs text-muted-foreground">Responsables</p>
            </div>
          </Link>
          <Link
            href="/pacientes"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <PawPrint className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Buscar paciente</p>
              <p className="text-xs text-muted-foreground">Mascotas</p>
            </div>
          </Link>
          <Link
            href="/clientes/nuevo"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <UserPlus className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Crear cliente/paciente</p>
              <p className="text-xs text-muted-foreground">Registro nuevo</p>
            </div>
          </Link>
          <Link
            href="/atenciones"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <ClipboardList className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Atenciones abiertas</p>
              <p className="text-xs text-muted-foreground">Flujo legacy/transición</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Programados hoy */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Programados hoy</h2>
          <Link href="/agenda" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver agenda completa
          </Link>
        </div>

        {(citasHoy ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay citas programadas para hoy.
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {(citasHoy ?? []).map((cita: any) => (
              <div
                key={cita.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {cita.tipo_citas?.color && (
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cita.tipo_citas.color }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate flex items-center gap-1">
                      {cita.mascotas?.alertas_criticas?.trim() && (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      {cita.mascotas?.nombre ?? "Sin paciente"}
                      {cita.mascotas?.codigo_text?.trim() ? (
                        <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
                          #{cita.mascotas.codigo_text}
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cita.clientes?.nombre ?? "Sin responsable"} ·{" "}
                      {cita.tipo_citas?.nombre ?? "Sin tipo"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {format(new Date(cita.start_date), "HH:mm")}
                  </span>
                  <Badge variant="secondary">
                    {
                      getCombinedOperationalStatus({
                        citaEstado: cita.estado,
                        ordenEstado: ordenActivaByMascotaId.get(cita.mascotas?.id)?.estado_text,
                      }).label
                    }
                  </Badge>
                  {(() => {
                    const orden = ordenActivaByMascotaId.get(cita.mascotas?.id);
                    if (!orden) return null;
                    const financial = getFinancialStatusMeta({
                      hasVenta: orden.financial_has_venta,
                      ventaEstado: orden.financial_venta_estado,
                      saldoPendiente: orden.financial_saldo_pendiente,
                    });
                    return <Badge variant="outline">{financial.label}</Badge>;
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Atenciones abiertas */}
      {ordenesActivas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">
              Atenciones abiertas ({ordenesActivas.length})
            </h2>
            <Link
              href="/atenciones"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver todas
            </Link>
          </div>
          <div className="divide-y rounded-lg border">
            {ordenesActivas.slice(0, 8).map((orden: any) => (
              <div
                key={orden.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      orden.estado_text === "in_progress"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {orden.mascotas?.nombre ?? "Sin paciente"}
                      {orden.mascotas?.codigo_text?.trim() ? ` #${orden.mascotas.codigo_text}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {orden.clientes?.nombre ?? "Sin responsable"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={orden.estado_text === "in_progress" ? "default" : "secondary"}>
                    {getOrdenStatusMeta(orden.estado_text).label}
                  </Badge>
                  <Badge variant="outline">
                    {
                      getFinancialStatusMeta({
                        hasVenta: orden.financial_has_venta,
                        ventaEstado: orden.financial_venta_estado,
                        saldoPendiente: orden.financial_saldo_pendiente,
                      }).label
                    }
                  </Badge>
                  <Link
                    href={`/orden_y_colas/${orden.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
