import Link from "next/link";
import { redirect } from "next/navigation";
import { format, isToday, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  CalendarDays,
  Users,
  PawPrint,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getActiveClinicaContext } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getActiveClinicaContext();
  if (!context) redirect("/select-clinica");

  const supabase = await createClient();
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const cid = context.clinicaId;

  const [
    clinicaRes,
    clientesRes,
    mascotasRes,
    ordenesActivasRes,
    citasHoyRes,
    citasProximasRes,
    ventasHoyRes,
    ordenesRecientesRes,
    citasHoyDetalleRes,
  ] = await Promise.all([
    supabase.from("clinicas").select("nombre").eq("id", cid).maybeSingle(),

    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("clinica_id", cid),

    supabase.from("mascotas").select("id", { count: "exact", head: true }).eq("clinica_id", cid),

    supabase
      .from("ordenes_servicio")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .in("estado_text", ["open", "in_progress"]),

    supabase
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .gte("start_date", todayStart)
      .lte("start_date", todayEnd),

    supabase
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .gt("start_date", todayEnd)
      .lte("start_date", in7Days),

    supabase
      .from("ledger")
      .select("monto")
      .eq("clinica_id", cid)
      .eq("tipo", "pago")
      .gte("fecha", todayStart)
      .lte("fecha", todayEnd),

    supabase
      .from("ordenes_servicio")
      .select(`
        id, estado_text, started_at,
        clientes:cliente_id ( nombre ),
        mascotas:mascota_id ( nombre )
      `)
      .eq("clinica_id", cid)
      .in("estado_text", ["open", "in_progress"])
      .order("started_at", { ascending: true })
      .limit(5),

    supabase
      .from("citas")
      .select(`
        id, start_date, estado,
        clientes:cliente_id ( nombre ),
        mascotas:mascota_id ( nombre ),
        tipo_citas:tipo_cita_id ( nombre, color )
      `)
      .eq("clinica_id", cid)
      .gte("start_date", todayStart)
      .lte("start_date", todayEnd)
      .order("start_date")
      .limit(6),
  ]);

  const clinicaNombre = clinicaRes.data?.nombre ?? "Clínica activa";
  const clientesCount = clientesRes.count ?? 0;
  const mascotasCount = mascotasRes.count ?? 0;
  const ordenesActivasCount = ordenesActivasRes.count ?? 0;
  const citasHoyCount = citasHoyRes.count ?? 0;
  const citasProximasCount = citasProximasRes.count ?? 0;
  const ventasHoy = (ventasHoyRes.data ?? []).reduce((s, r) => s + Number(r.monto), 0);
  const ordenesRecientes = ordenesRecientesRes.data ?? [];
  const citasHoy = citasHoyDetalleRes.data ?? [];

  const estadoLabel: Record<string, { label: string; cls: string }> = {
    open:        { label: "En espera",  cls: "bg-amber-100 text-amber-800" },
    in_progress: { label: "En atención", cls: "bg-blue-100 text-blue-800" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Panel operativo</h1>
        <p className="text-sm text-muted-foreground">
          {clinicaNombre} · {format(now, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Atenciones activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ordenesActivasCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {ordenesActivasCount === 0 ? "Sin pacientes en espera" : "Pacientes en sala o consulta"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Citas de hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{citasHoyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {citasProximasCount} más en los próximos 7 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cobrado hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${ventasHoy.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagos registrados en ledger hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Clientes / Mascotas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mascotasCount} mascotas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sala de espera */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Sala de espera</CardTitle>
              <CardDescription>Órdenes activas ahora</CardDescription>
            </div>
            <Link
              href="/atenciones"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Ver todas <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {ordenesRecientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
                <AlertCircle className="h-8 w-8 opacity-30" />
                <p>No hay atenciones activas en este momento.</p>
                <Link href="/atenciones" className={buttonVariants({ size: "sm" })}>
                  Nueva atención
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {ordenesRecientes.map((o) => {
                  const info = estadoLabel[o.estado_text] ?? estadoLabel.open;
                  const mins = o.started_at
                    ? Math.floor((now.getTime() - new Date(o.started_at).getTime()) / 60000)
                    : null;
                  return (
                    <Link
                      key={o.id}
                      href={`/orden_y_colas/${o.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                    >
                      <PawPrint className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {(o.mascotas as any)?.nombre ?? "Sin mascota"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(o.clientes as any)?.nombre ?? "Sin cliente"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {mins !== null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {mins} min
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.cls}`}>
                          {info.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Citas de hoy */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Agenda de hoy</CardTitle>
              <CardDescription>
                {citasHoyCount === 0 ? "Sin citas programadas" : `${citasHoyCount} cita${citasHoyCount !== 1 ? "s" : ""} hoy`}
              </CardDescription>
            </div>
            <Link
              href="/agenda"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Ver agenda <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {citasHoy.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
                <CalendarDays className="h-8 w-8 opacity-30" />
                <p>No hay citas para hoy.</p>
                <Link href="/agenda" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Ir a la agenda
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {citasHoy.map((c) => {
                  const tipo = c.tipo_citas as any;
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-3">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tipo?.color ?? "#94a3b8" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {(c.mascotas as any)?.nombre ?? "Sin mascota"}
                          <span className="font-normal text-muted-foreground"> · {(c.clientes as any)?.nombre ?? ""}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tipo?.nombre ?? "Sin tipo"} · {format(new Date(c.start_date), "HH:mm", { locale: es })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.estado === "completada"
                          ? "bg-green-100 text-green-800"
                          : c.estado === "confirmada"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        {c.estado === "completada" ? "Completada" : c.estado === "confirmada" ? "Confirmada" : "Programada"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/atenciones" className={buttonVariants({})}>
            Nueva atención
          </Link>
          <Link href="/agenda" className={buttonVariants({ variant: "outline" })}>
            Ver agenda
          </Link>
          <Link href="/clientes/nuevo" className={buttonVariants({ variant: "outline" })}>
            Registrar cliente
          </Link>
          <Link href="/caja" className={buttonVariants({ variant: "outline" })}>
            Revisar caja
          </Link>
          <Link href="/colas" className={buttonVariants({ variant: "outline" })}>
            Ver sala de espera
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
