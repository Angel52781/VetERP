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
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getActiveClinicaContext } from "@/lib/clinica";
import { formatMoneyPEN } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import {
  getCombinedOperationalStatus,
  getFinancialStatusMeta,
  getOrdenStatusMeta,
  getToneBadgeClass,
} from "@/lib/operational-status";
import { IniciarAtencionCitaBtn } from "../agenda/iniciar-atencion-cita-btn";
import { RecordatoriosPanel, type DashboardRecordatorio } from "./recordatorios-panel";

export const dynamic = "force-dynamic";

type RawRecordatorioMascota = Omit<NonNullable<DashboardRecordatorio["mascotas"]>, "clientes"> & {
  clientes: NonNullable<DashboardRecordatorio["mascotas"]>["clientes"] | NonNullable<DashboardRecordatorio["mascotas"]>["clientes"][] | null;
};

type RawDashboardRecordatorio = Omit<DashboardRecordatorio, "mascotas"> & {
  mascotas: RawRecordatorioMascota | RawRecordatorioMascota[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function normalizeRecordatorios(data: unknown): DashboardRecordatorio[] {
  return ((data ?? []) as RawDashboardRecordatorio[]).map((recordatorio) => {
    const mascota = firstRelation(recordatorio.mascotas);
    const cliente = firstRelation(mascota?.clientes);

    return {
      ...recordatorio,
      mascotas: mascota
        ? {
            id: mascota.id,
            nombre: mascota.nombre,
            clientes: cliente,
          }
        : null,
    };
  });
}

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
    seguimientosVencidosDetalleRes,
    seguimientosProximos7DetalleRes,
    seguimientosProximos30DetalleRes,
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
      .eq("estado_text", "pendiente")
      .not("proxima_fecha_date", "is", null)
      .lt("proxima_fecha_date", todayDate),

    supabase
      .from("seguimientos_clinicos")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .eq("estado_text", "pendiente")
      .not("proxima_fecha_date", "is", null)
      .gte("proxima_fecha_date", todayDate)
      .lte("proxima_fecha_date", day7Date),

    supabase
      .from("seguimientos_clinicos")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", cid)
      .eq("estado_text", "pendiente")
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
      .eq("estado_text", "pendiente")
      .not("proxima_fecha_date", "is", null)
      .lt("proxima_fecha_date", todayDate)
      .order("proxima_fecha_date", { ascending: true })
      .limit(8),

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
      .eq("estado_text", "pendiente")
      .not("proxima_fecha_date", "is", null)
      .gte("proxima_fecha_date", todayDate)
      .lte("proxima_fecha_date", day7Date)
      .order("proxima_fecha_date", { ascending: true })
      .limit(8),

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
      .eq("estado_text", "pendiente")
      .not("proxima_fecha_date", "is", null)
      .gte("proxima_fecha_date", day8Date)
      .lte("proxima_fecha_date", day30Date)
      .order("proxima_fecha_date", { ascending: true })
      .limit(8),
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
  const seguimientosVencidos = normalizeRecordatorios(seguimientosVencidosDetalleRes.data);
  const seguimientosProximos7 = normalizeRecordatorios(seguimientosProximos7DetalleRes.data);
  const seguimientosProximos30 = normalizeRecordatorios(seguimientosProximos30DetalleRes.data);
  const mascotaIdsDeCitasHoy = Array.from(new Set(citasHoy.map((c: any) => c.mascota_id).filter(Boolean)));
  const ordenActivaByMascota = new Map<string, any>();
  const ventaByOrden = new Map<string, any>();

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
  const orderIds = ordenesRecientes.map((orden: any) => orden.id);
  if (orderIds.length > 0) {
    const { data: ventasDeOrden } = await supabase
      .from("ventas")
      .select("id, orden_id, estado, total, created_at, ledger ( tipo, monto )")
      .eq("clinica_id", cid)
      .in("orden_id", orderIds)
      .order("created_at", { ascending: false });

    for (const venta of ventasDeOrden ?? []) {
      const key = venta.orden_id;
      if (!key) continue;
      const current = ventaByOrden.get(key);
      if (!current || (current.estado !== "abierta" && venta.estado === "abierta")) {
        ventaByOrden.set(key, venta);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Panel operativo</h1>
        <p className="text-sm text-muted-foreground">
          {clinicaNombre} · {format(now, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2">
        <Link href="/recepcion" className={buttonVariants({})}>
          Ir a Recepción
        </Link>
        <Link href="/agenda" className={buttonVariants({ variant: "outline" })}>
          Agenda
        </Link>
        <Link href="/grooming" className={buttonVariants({ variant: "outline" })}>
          Grooming
        </Link>
        <Link href="/caja" className={buttonVariants({ variant: "outline" })}>
          Caja
        </Link>
        <Link href="/inventario" className={buttonVariants({ variant: "outline" })}>
          Inventario
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

      <RecordatoriosPanel
        todayDate={todayDate}
        day7Date={day7Date}
        counts={{
          vencidos: seguimientosVencidosCount,
          proximos7: seguimientosProximos7Count,
          proximos30: seguimientosProximos30Count,
        }}
        vencidos={seguimientosVencidos}
        proximos7={seguimientosProximos7}
        proximos30={seguimientosProximos30}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sala de espera */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Sala de espera</CardTitle>
              <CardDescription>Órdenes activas ahora</CardDescription>
            </div>
            <Link
              href="/recepcion"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Ver en Recepción <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {ordenesRecientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
                <AlertCircle className="h-8 w-8 opacity-30" />
                <p>No hay atenciones activas en este momento.</p>
                <Link href="/recepcion" className={buttonVariants({ size: "sm" })}>
                  Ir a Recepción
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {ordenesRecientes.map((o) => {
                  const ordenMeta = getOrdenStatusMeta(o.estado_text);
                  const venta = ventaByOrden.get(o.id);
                  const total = Number(venta?.total ?? 0);
                  const pagado = (venta?.ledger ?? [])
                    .filter((mov: any) => mov.tipo === "pago")
                    .reduce((acc: number, mov: any) => acc + Number(mov.monto), 0);
                  const financialMeta = getFinancialStatusMeta({
                    hasVenta: Boolean(venta?.id),
                    ventaEstado: venta?.estado ?? null,
                    saldoPendiente: Math.max(0, total - pagado),
                  });
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
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getToneBadgeClass(ordenMeta.tone)}`}>
                          {ordenMeta.label}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getToneBadgeClass(financialMeta.tone)}`}>
                          {financialMeta.label}
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
                        {(() => {
                          const ordenActiva = ordenActivaByMascota.get(c.mascota_id);
                          const operationalMeta = getCombinedOperationalStatus({
                            citaEstado: c.estado,
                            ordenEstado: ordenActiva?.estado_text,
                          });
                          const venta = ordenActiva?.id ? ventaByOrden.get(ordenActiva.id) : null;
                          const total = Number(venta?.total ?? 0);
                          const pagado = (venta?.ledger ?? [])
                            .filter((mov: any) => mov.tipo === "pago")
                            .reduce((acc: number, mov: any) => acc + Number(mov.monto), 0);
                          const financialMeta = getFinancialStatusMeta({
                            hasVenta: Boolean(venta?.id),
                            ventaEstado: venta?.estado ?? null,
                            saldoPendiente: Math.max(0, total - pagado),
                          });

                          return (
                            <>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getToneBadgeClass(operationalMeta.tone)}`}>
                                {operationalMeta.label}
                              </span>
                              {ordenActiva?.id ? (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getToneBadgeClass(financialMeta.tone)}`}>
                                  {financialMeta.label}
                                </span>
                              ) : null}
                            </>
                          );
                        })()}
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


    </div>
  );
}
