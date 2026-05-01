import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays, format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  CalendarDays,
  PawPrint,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Wallet,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getActiveClinicaContext } from "@/lib/clinica";
import { formatMoneyPEN } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { IniciarAtencionCitaBtn } from "../agenda/iniciar-atencion-cita-btn";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getActiveClinicaContext();
  if (!context) redirect("/select-clinica");

  const supabase = await createClient();
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayDate = format(now, "yyyy-MM-dd");
  const day7Date = format(addDays(now, 7), "yyyy-MM-dd");
  const day8Date = format(addDays(now, 8), "yyyy-MM-dd");
  const day30Date = format(addDays(now, 30), "yyyy-MM-dd");

  const cid = context.clinicaId;

  const [
    clinicaRes,
    ordenesActivasRes,
    citasHoyRes,
    citasProximasRes,
    ventasHoyRes,
    ventasPendientesRes,
    ordenesRecientesRes,
    citasHoyDetalleRes,
    seguimientosVencidosRes,
    seguimientosProximos7Res,
    seguimientosProximos30Res,
    seguimientosOperativosRes,
  ] = await Promise.all([
    supabase.from("clinicas").select("nombre").eq("id", cid).maybeSingle(),

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
      .from("ventas")
      .select(`
        id,
        total,
        ledger ( monto )
      `)
      .eq("clinica_id", cid)
      .neq("estado", "pagada"),

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
        id, start_date, estado, cliente_id, mascota_id,
        clientes:cliente_id ( nombre ),
        mascotas:mascota_id ( nombre ),
        tipo_citas:tipo_cita_id ( nombre, color )
      `)
      .eq("clinica_id", cid)
      .gte("start_date", todayStart)
      .lte("start_date", todayEnd)
      .order("start_date")
      .limit(6),

    supabase
      .from("seguimientos_clinicos")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .not("proxima_fecha_date", "is", null)
      .lt("proxima_fecha_date", todayDate),

    supabase
      .from("seguimientos_clinicos")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .not("proxima_fecha_date", "is", null)
      .gte("proxima_fecha_date", todayDate)
      .lte("proxima_fecha_date", day7Date),

    supabase
      .from("seguimientos_clinicos")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .not("proxima_fecha_date", "is", null)
      .gte("proxima_fecha_date", day8Date)
      .lte("proxima_fecha_date", day30Date),

    supabase
      .from("seguimientos_clinicos")
      .select(`
        id,
        tipo_text,
        nombre_text,
        proxima_fecha_date,
        mascotas:mascota_id (
          id,
          nombre,
          clientes:cliente_id ( id, nombre )
        )
      `)
      .eq("clinica_id", cid)
      .not("proxima_fecha_date", "is", null)
      .lte("proxima_fecha_date", day30Date)
      .order("proxima_fecha_date", { ascending: true })
      .limit(12),
  ]);

  const clinicaNombre = clinicaRes.data?.nombre ?? "Clínica activa";
  const ordenesActivasCount = ordenesActivasRes.count ?? 0;
  const citasHoyCount = citasHoyRes.count ?? 0;
  const citasProximasCount = citasProximasRes.count ?? 0;
  const ventasHoy = (ventasHoyRes.data ?? []).reduce((s, r) => s + Number(r.monto), 0);
  const ventasPendientes = ventasPendientesRes.data ?? [];
  const cuentasPorCobrar = ventasPendientes.reduce((acc, venta) => {
    const pagado = (venta.ledger ?? []).reduce((sum: number, mov: any) => sum + Number(mov.monto), 0);
    return acc + Math.max(0, Number(venta.total) - pagado);
  }, 0);
  const ordenesRecientes = ordenesRecientesRes.data ?? [];
  const citasHoy = citasHoyDetalleRes.data ?? [];
  const seguimientosVencidosCount = seguimientosVencidosRes.count ?? 0;
  const seguimientosProximos7Count = seguimientosProximos7Res.count ?? 0;
  const seguimientosProximos30Count = seguimientosProximos30Res.count ?? 0;
  const seguimientosOperativos = seguimientosOperativosRes.data ?? [];
  const mascotaIdsDeCitasHoy = Array.from(new Set(citasHoy.map((c: any) => c.mascota_id).filter(Boolean)));
  const ordenActivaByMascota = new Map<string, any>();

  if (mascotaIdsDeCitasHoy.length > 0) {
    const { data: ordenesActivasDeCitas } = await supabase
      .from("ordenes_servicio")
      .select("id, mascota_id, estado_text, started_at")
      .eq("clinica_id", cid)
      .in("estado_text", ["open", "in_progress"])
      .in("mascota_id", mascotaIdsDeCitasHoy);

    for (const orden of ordenesActivasDeCitas ?? []) {
      const current = ordenActivaByMascota.get(orden.mascota_id);
      if (!current) {
        ordenActivaByMascota.set(orden.mascota_id, orden);
        continue;
      }

      if (current.estado_text !== "in_progress" && orden.estado_text === "in_progress") {
        ordenActivaByMascota.set(orden.mascota_id, orden);
      }
    }
  }

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

      <div className="flex flex-wrap gap-2">
        <Link href="/agenda" className={buttonVariants({})}>
          Ir a agenda del día
        </Link>
        <Link href="/atenciones" className={buttonVariants({ variant: "outline" })}>
          Ir a atenciones activas
        </Link>
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
            <CardTitle className="text-sm font-medium">Cobros pendientes</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatMoneyPEN(cuentasPorCobrar)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {ventasPendientes.length} venta{ventasPendientes.length !== 1 ? "s" : ""} con saldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cobrado hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatMoneyPEN(ventasHoy)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagos registrados en ledger hoy
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Recordatorios clínicos</CardTitle>
            <CardDescription>
              Seguimientos con vencimiento operativo: vencidos, próximos 7 días y próximos 30 días.
            </CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-lg border p-3 ${seguimientosVencidosCount > 0 ? "border-red-200 bg-red-50/40" : "bg-muted/10"}`}>
              <p className={`text-xs font-medium ${seguimientosVencidosCount > 0 ? "text-red-700" : "text-muted-foreground"}`}>Vencidos</p>
              <p className={`text-2xl font-bold ${seguimientosVencidosCount > 0 ? "text-red-700" : "text-foreground"}`}>{seguimientosVencidosCount}</p>
            </div>
            <div className={`rounded-lg border p-3 ${seguimientosProximos7Count > 0 ? "border-orange-200 bg-orange-50/40" : "bg-muted/10"}`}>
              <p className={`text-xs font-medium ${seguimientosProximos7Count > 0 ? "text-orange-700" : "text-muted-foreground"}`}>Próximos 7 días</p>
              <p className={`text-2xl font-bold ${seguimientosProximos7Count > 0 ? "text-orange-700" : "text-foreground"}`}>{seguimientosProximos7Count}</p>
            </div>
            <div className={`rounded-lg border p-3 ${seguimientosProximos30Count > 0 ? "border-blue-200 bg-blue-50/40" : "bg-muted/10"}`}>
              <p className={`text-xs font-medium ${seguimientosProximos30Count > 0 ? "text-blue-700" : "text-muted-foreground"}`}>Próximos 30 días</p>
              <p className={`text-2xl font-bold ${seguimientosProximos30Count > 0 ? "text-blue-700" : "text-foreground"}`}>{seguimientosProximos30Count}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {seguimientosOperativos.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Sin seguimientos con vencimiento en el rango operativo actual.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {seguimientosOperativos.map((seguimiento: any) => {
                const proximaFecha = seguimiento.proxima_fecha_date as string;
                const estado = proximaFecha < todayDate
                  ? { label: "Vencido", cls: "bg-red-100 text-red-800" }
                  : proximaFecha <= day7Date
                    ? { label: "Próximo (7d)", cls: "bg-orange-100 text-orange-800" }
                    : { label: "Próximo (30d)", cls: "bg-blue-100 text-blue-800" };
                const mascota = seguimiento.mascotas as any;
                const cliente = mascota?.clientes as any;

                return (
                  <div key={seguimiento.id} className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      seguimiento.tipo_text === "vacuna" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {seguimiento.tipo_text === "vacuna" ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <Stethoscope className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{mascota?.nombre ?? "Paciente sin nombre"}</p>
                      <p className="text-xs text-muted-foreground truncate">{cliente?.nombre ?? "Responsable no disponible"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="uppercase font-medium">{seguimiento.tipo_text}</span> · {seguimiento.nombre_text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Próxima fecha: {format(new Date(`${proximaFecha}T00:00:00`), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${estado.cls}`}>
                        {estado.label}
                      </span>
                      <Link
                        href={`/mascotas/${mascota?.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver paciente
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                          {(o.mascotas as any)?.nombre ?? "Sin paciente"}
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
                          {(c.mascotas as any)?.nombre ?? "Sin paciente"}
                          <span className="font-normal text-muted-foreground"> · {(c.clientes as any)?.nombre ?? ""}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tipo?.nombre ?? "Sin tipo"} · {format(new Date(c.start_date), "HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          c.estado === "completada"
                            ? "bg-green-100 text-green-800"
                            : c.estado === "en_atencion"
                            ? "bg-indigo-100 text-indigo-800"
                            : c.estado === "llego"
                            ? "bg-amber-100 text-amber-800"
                            : c.estado === "confirmada"
                            ? "bg-blue-100 text-blue-800"
                          : c.estado === "cancelada"
                            ? "bg-red-100 text-red-800"
                          : c.estado === "no_asistio"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          {c.estado === "completada"
                            ? "Completada"
                            : c.estado === "en_atencion"
                            ? "En atención"
                            : c.estado === "llego"
                            ? "Llegó"
                            : c.estado === "confirmada"
                            ? "Confirmada"
                            : c.estado === "cancelada"
                            ? "Cancelada"
                            : c.estado === "no_asistio"
                            ? "No asistió"
                            : "Programada"}
                        </span>
                        {ordenActivaByMascota.get(c.mascota_id) ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            En atención
                          </span>
                        ) : null}
                        <IniciarAtencionCitaBtn
                          citaId={c.id}
                          clienteId={c.cliente_id}
                          mascotaId={c.mascota_id}
                          citaEstado={c.estado}
                          citaStartDate={c.start_date}
                          activeOrderId={ordenActivaByMascota.get(c.mascota_id)?.id ?? null}
                          activeOrderEstadoText={ordenActivaByMascota.get(c.mascota_id)?.estado_text ?? null}
                          compact
                        />
                      </div>
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
