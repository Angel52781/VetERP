import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, Mail, ArrowLeft, PawPrint, CalendarDays, Clock, ExternalLink, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { formatMoneyPEN } from "@/lib/money";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
import { getAgeFromDateOnly } from "@/lib/date-only";
import { createClient } from "@/lib/supabase/server";

import MascotaForm from "./mascota-form";
import { AccionesContextualesCliente } from "./acciones-contextuales";
import { ClienteEditDialog } from "./cliente-edit-dialog";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email, created_at")
    .eq("id", clienteId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  if (!cliente) notFound();

  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id, nombre, codigo_text, especie, raza, nacimiento")
    .eq("cliente_id", clienteId)
    .eq("clinica_id", clinicaId)
    .order("nombre");

  // Últimas órdenes del cliente
  const { data: ordenes } = await supabase
    .from("ordenes_servicio")
    .select(`
      id, estado_text, mascota_id, started_at, created_at,
      mascotas:mascota_id ( nombre )
    `)
    .eq("clinica_id", clinicaId)
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Próximas citas del cliente
  const { data: citas } = await supabase
    .from("citas")
    .select(`
      id, start_date, estado,
      mascotas:mascota_id ( nombre ),
      tipo_citas:tipo_cita_id ( nombre, color )
    `)
    .eq("clinica_id", clinicaId)
    .eq("cliente_id", clienteId)
    .gte("start_date", new Date().toISOString())
    .order("start_date")
    .limit(3);

  const { data: tiposCita } = await supabase
    .from("tipo_citas")
    .select("id, nombre, duracion_min")
    .eq("clinica_id", clinicaId)
    .order("nombre");

  const { data: ventasCuenta } = await supabase
    .from("ventas")
    .select(`
      id,
      orden_id,
      estado,
      total,
      created_at,
      ledger ( id, tipo, monto, fecha, metodo_pago ),
      ordenes_servicio:orden_id (
        id,
        mascota_id,
        mascotas:mascota_id ( id, nombre )
      )
    `)
    .eq("clinica_id", clinicaId)
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  const estadoCuentaRows = (ventasCuenta || []).map((venta: any) => {
    const pagos = (venta.ledger || []).filter((mov: any) => mov.tipo === "pago");
    const total = Number(venta.total) || 0;
    const pagado = pagos.reduce((acc: number, mov: any) => acc + Number(mov.monto), 0);
    const saldo = venta.estado === "anulada" ? 0 : Math.max(0, total - pagado);

    const orden = venta.ordenes_servicio as any;

    return {
      id: venta.id,
      ordenId: venta.orden_id as string | null,
      createdAt: venta.created_at as string,
      ventaEstado: venta.estado as string,
      total,
      pagado,
      saldo,
      pagos: pagos.map((mov: any) => ({
        id: mov.id as string,
        monto: Number(mov.monto) || 0,
        fecha: mov.fecha as string,
        metodoPago: (mov.metodo_pago as string | null) ?? null,
      })),
    };
  });

  const totalVendido = estadoCuentaRows
    .filter((row) => row.ventaEstado !== "anulada")
    .reduce((acc, row) => acc + row.total, 0);
  const totalPagadoHistorico = estadoCuentaRows
    .filter((row) => row.ventaEstado !== "anulada")
    .reduce((acc, row) => acc + row.pagado, 0);
  const deudaTotal = Math.max(0, totalVendido - totalPagadoHistorico);
  const ordenActiva = (ordenes || []).find((orden: any) =>
    ["open", "in_progress"].includes(orden.estado_text)
  ) as any | undefined;
  const ventaPendienteConOrden = estadoCuentaRows.find(
    (row) => row.ventaEstado !== "anulada" && row.saldo > 0 && row.ordenId
  );
  const ordenActivaByMascota = new Map<string, any>();
  for (const orden of ordenes || []) {
    if (!["open", "in_progress"].includes((orden as any).estado_text)) continue;
    const mascotaId = (orden as any).mascota_id as string | null;
    if (!mascotaId || ordenActivaByMascota.has(mascotaId)) continue;
    ordenActivaByMascota.set(mascotaId, orden);
  }

  const movimientosPorVenta = estadoCuentaRows.flatMap((row) => {
    const cargo =
      row.ventaEstado === "anulada"
        ? []
        : [
            {
              id: `cargo-${row.id}`,
              fecha: row.createdAt,
              tipo: "cargo" as const,
              concepto: `Cargo por venta VTA-${row.id.slice(0, 8).toUpperCase()}`,
              cargo: row.total,
              pago: 0,
              ordenId: row.ordenId,
              ventaId: row.id,
            },
          ];

    const pagos = row.pagos.map((mov: { id: string; monto: number; fecha: string; metodoPago: string | null }) => ({
      id: `pago-${mov.id}`,
      fecha: mov.fecha,
      tipo: "pago" as const,
      concepto: `Pago${mov.metodoPago ? ` (${mov.metodoPago})` : ""} · VTA-${row.id.slice(0, 8).toUpperCase()}`,
      cargo: 0,
      pago: mov.monto,
      ordenId: row.ordenId,
      ventaId: row.id,
    }));

    return [...cargo, ...pagos];
  });

  const movimientosCuenta = movimientosPorVenta.sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  let saldoAcumulado = 0;
  const movimientosConSaldo = movimientosCuenta.map((mov) => {
    saldoAcumulado += mov.cargo - mov.pago;
    return {
      ...mov,
      saldoAcumulado: Number.isFinite(saldoAcumulado) ? saldoAcumulado : 0,
    };
  });

  const estadoOrden: Record<string, { label: string; cls: string }> = {
    open:        { label: "En espera",   cls: "bg-amber-100 text-amber-800" },
    in_progress: { label: "En atención", cls: "bg-blue-100 text-blue-800" },
    finished:    { label: "Finalizada",  cls: "bg-green-100 text-green-800" },
    closed:      { label: "Cerrada",     cls: "bg-secondary text-secondary-foreground" },
  };

  const now = new Date();
  const clienteReturnTo = encodeURIComponent(`/clientes/${clienteId}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/clientes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Volver a Clientes
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0 select-none shadow-sm border border-primary/20">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {cliente.telefono && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="h-4 w-4 text-primary/70" /> {cliente.telefono}
                </span>
              )}
              {cliente.email && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="h-4 w-4 text-primary/70" /> {cliente.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary/70" />
                Alta: {format(new Date(cliente.created_at), "dd MMM yyyy", { locale: es })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {ordenActiva ? (
            <Link
              href={`/orden_y_colas/${ordenActiva.id}?returnTo=${clienteReturnTo}`}
              className={buttonVariants({ variant: "secondary", size: "sm", className: "w-full sm:w-auto" })}
            >
              Ver atención
            </Link>
          ) : null}
          <ClienteEditDialog cliente={cliente} />
          <AccionesContextualesCliente
            clienteId={clienteId}
            clienteNombre={cliente.nombre}
            tiposCita={tiposCita || []}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Pacientes totales</p>
            <p className="text-2xl font-bold">{mascotas?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Últimas Atenciones</p>
            <p className="text-2xl font-bold">{ordenes?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Citas Próximas</p>
            <p className="text-2xl font-bold">{citas?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Estado de cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Estado de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-md border px-3 py-2 text-sm ${deudaTotal > 0 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-muted bg-muted/30 text-muted-foreground"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{deudaTotal > 0 ? `Deuda pendiente ${formatMoneyPEN(deudaTotal)}` : "Sin deuda pendiente"}</span>
              {deudaTotal > 0 && ventaPendienteConOrden?.ordenId ? (
                <Link
                  href={`/orden_y_colas/${ventaPendienteConOrden.ordenId}?tab=venta&returnTo=${clienteReturnTo}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Ir a cobro
                </Link>
              ) : null}
            </div>
          </div>

          <details className="group rounded-md border bg-muted/10 px-3 py-2">
            <summary className="cursor-pointer list-none text-sm font-medium">
              <span className="group-open:hidden">Ver movimientos del estado de cuenta</span>
              <span className="hidden group-open:inline">Ocultar movimientos del estado de cuenta</span>
            </summary>
            <div className="mt-3 overflow-hidden rounded-md border bg-background">
              <Table className="min-w-[860px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Cargo</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Saldo acumulado</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosConSaldo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                        Este cliente todavía no tiene movimientos financieros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientosConSaldo.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-xs font-medium">
                          {format(new Date(mov.fecha), "dd/MM/yy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mov.tipo === "cargo" ? "secondary" : "default"}>
                            {mov.tipo === "cargo" ? "Cargo" : "Pago"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{mov.concepto}</TableCell>
                        <TableCell className="text-right font-medium">{mov.cargo > 0 ? formatMoneyPEN(mov.cargo) : "—"}</TableCell>
                        <TableCell className="text-right text-emerald-700">{mov.pago > 0 ? formatMoneyPEN(mov.pago) : "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMoneyPEN(mov.saldoAcumulado)}</TableCell>
                        <TableCell className="text-center">
                          {mov.ordenId ? (
                            <Link
                              href={`/orden_y_colas/${mov.ordenId}?returnTo=${clienteReturnTo}`}
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              Ver orden
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pacientes */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PawPrint className="h-4 w-4" />
                Pacientes ({mascotas?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!mascotas?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin pacientes registrados. Usa el formulario para agregar uno.
                </p>
              ) : (
                <div className="divide-y">
                  {mascotas.map((m) => {
                    const edad = getAgeFromDateOnly(m.nacimiento, now);
                    const ordenMascotaActiva = ordenActivaByMascota.get(m.id);
                    return (
                      <div key={m.id} className="-mx-2 flex flex-col gap-3 rounded px-2 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                        <Link
                          href={`/mascotas/${m.id}?returnTo=${clienteReturnTo}`}
                          className="flex min-w-0 flex-1 items-center gap-3 group"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <PawPrint className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{m.nombre}</p>
                              {m.codigo_text?.trim() ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                  #{m.codigo_text}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {[formatSpeciesLabel(m.especie), formatBreedLabel(m.raza)].filter(Boolean).join(" · ")}
                              {edad !== null ? ` · ${edad} año${edad !== 1 ? "s" : ""}` : ""}
                            </p>
                          </div>
                        </Link>
                        {ordenMascotaActiva ? (
                          <Link
                            href={`/orden_y_colas/${ordenMascotaActiva.id}?returnTo=${clienteReturnTo}`}
                            className={buttonVariants({ variant: "outline", size: "sm", className: "w-full sm:w-auto" })}
                          >
                            Ver atención
                          </Link>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de atenciones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Últimas atenciones
              </CardTitle>
              {(ordenes?.length ?? 0) > 0 && (
                <Link
                  href="/atenciones"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ver todas
                </Link>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {!ordenes?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin atenciones registradas.
                </p>
              ) : (
                <div className="divide-y">
                  {ordenes.map((o) => {
                    const info = estadoOrden[o.estado_text] ?? estadoOrden.closed;
                    return (
                      <Link
                        key={o.id}
                        href={`/orden_y_colas/${o.id}?returnTo=${clienteReturnTo}`}
                        className="-mx-2 flex flex-col gap-3 rounded px-2 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            Orden ORD-{o.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(o.mascotas as any)?.nombre ?? "Sin paciente"} ·{" "}
                            {format(new Date(o.created_at), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${info.cls}`}>
                          {info.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: citas proximas + agregar paciente */}
        <div className="space-y-6">
          {/* Próximas citas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Próximas citas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!citas?.length ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin citas próximas.
                </p>
              ) : (
                <div className="space-y-3">
                  {citas.map((c) => {
                    const tipo = c.tipo_citas as any;
                    return (
                      <div key={c.id} className="flex items-start gap-2">
                        <div
                          className="mt-1 h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: tipo?.color ?? "#94a3b8" }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tipo?.nombre ?? "Cita"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(c.mascotas as any)?.nombre ?? ""} ·{" "}
                            {format(new Date(c.start_date), "dd MMM HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 pt-3 border-t">
                <Link
                  href="/agenda"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}
                >
                  Ver agenda completa
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Agregar paciente */}
          <MascotaForm clienteId={clienteId} />
        </div>
      </div>
    </div>
  );
}
