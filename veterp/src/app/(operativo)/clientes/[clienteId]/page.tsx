import Link from "next/link";
import { notFound } from "next/navigation";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, Mail, ArrowLeft, PawPrint, CalendarDays, Clock, ExternalLink, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { formatMoneyPEN } from "@/lib/money";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
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
    .select("id, nombre, especie, raza, nacimiento")
    .eq("cliente_id", clienteId)
    .eq("clinica_id", clinicaId)
    .order("nombre");

  // Últimas órdenes del cliente
  const { data: ordenes } = await supabase
    .from("ordenes_servicio")
    .select(`
      id, estado_text, started_at, created_at,
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

    let estadoCuenta: "pagada" | "pendiente" | "parcial" | "anulada" = "pendiente";
    if (venta.estado === "anulada") {
      estadoCuenta = "anulada";
    } else if (saldo <= 0 && total > 0) {
      estadoCuenta = "pagada";
    } else if (pagado > 0 && saldo > 0) {
      estadoCuenta = "parcial";
    }

    const orden = venta.ordenes_servicio as any;
    const mascota = orden?.mascotas as any;

    return {
      id: venta.id,
      ordenId: venta.orden_id as string | null,
      createdAt: venta.created_at as string,
      total,
      pagado,
      saldo,
      estadoCuenta,
      mascotaNombre: mascota?.nombre as string | undefined,
    };
  });

  const deudaTotal = estadoCuentaRows.reduce((acc, row) => acc + row.saldo, 0);
  const ventasPendientesCount = estadoCuentaRows.filter((row) => row.estadoCuenta === "pendiente" || row.estadoCuenta === "parcial").length;
  const totalPagadoHistorico = estadoCuentaRows
    .filter((row) => row.estadoCuenta !== "anulada")
    .reduce((acc, row) => acc + row.pagado, 0);
  const ventasPagadasCount = estadoCuentaRows.filter((row) => row.estadoCuenta === "pagada").length;

  const estadoCuentaBadge: Record<"pagada" | "pendiente" | "parcial" | "anulada", { label: string; className: string }> = {
    pagada: { label: "Pagada", className: "bg-emerald-100 text-emerald-800" },
    pendiente: { label: "Pendiente", className: "bg-amber-100 text-amber-800" },
    parcial: { label: "Parcial", className: "bg-blue-100 text-blue-800" },
    anulada: { label: "Anulada", className: "bg-muted text-muted-foreground" },
  };

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
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0 select-none shadow-sm border border-primary/20">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
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
        <div className="flex flex-wrap items-center gap-2">
          <ClienteEditDialog cliente={cliente} />
          <AccionesContextualesCliente
            clienteId={clienteId}
            clienteNombre={cliente.nombre}
            tiposCita={tiposCita || []}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <Card className={deudaTotal > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Deuda Pendiente</p>
            <p className={`text-2xl font-bold ${deudaTotal > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {formatMoneyPEN(deudaTotal)}
            </p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className={deudaTotal > 0 ? "border-amber-200 bg-amber-50/50" : "bg-muted/10 border-muted"}>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground">Deuda pendiente total</p>
                <p className={`text-xl font-bold ${deudaTotal > 0 ? "text-amber-700" : "text-emerald-700"}`}>{formatMoneyPEN(deudaTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground">Ventas pendientes</p>
                <p className="text-xl font-bold">{ventasPendientesCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground">Total pagado histórico</p>
                <p className="text-xl font-bold text-emerald-700">{formatMoneyPEN(totalPagadoHistorico)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground">Ventas pagadas</p>
                <p className="text-xl font-bold">{ventasPagadasCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center w-14">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estadoCuentaRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      Sin ventas registradas para este cliente.
                    </TableCell>
                  </TableRow>
                ) : (
                  estadoCuentaRows.map((row) => {
                    const estado = estadoCuentaBadge[row.estadoCuenta];
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs font-medium">
                          {format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>{row.mascotaNombre || "—"}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div className="font-medium">VTA-{row.id.slice(0, 8).toUpperCase()}</div>
                            {row.ordenId ? <div className="text-muted-foreground">ORD-{row.ordenId.slice(0, 8).toUpperCase()}</div> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatMoneyPEN(row.total)}</TableCell>
                        <TableCell className="text-right text-emerald-700">{formatMoneyPEN(row.pagado)}</TableCell>
                        <TableCell className={`text-right font-semibold ${row.saldo > 0 ? "text-amber-700" : "text-foreground"}`}>
                          {formatMoneyPEN(row.saldo)}
                        </TableCell>
                        <TableCell>
                          <Badge className={estado.className}>{estado.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.ordenId ? (
                            <Link
                              href={`/orden_y_colas/${row.ordenId}?tab=venta&returnTo=${clienteReturnTo}`}
                              className={buttonVariants({ variant: "ghost", size: "icon" })}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pacientes */}
        <div className="lg:col-span-2 space-y-6">
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
                    const edad = m.nacimiento
                      ? differenceInYears(now, new Date(m.nacimiento))
                      : null;
                    return (
                      <Link
                        key={m.id}
                        href={`/mascotas/${m.id}?returnTo=${clienteReturnTo}`}
                        className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <PawPrint className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{m.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {[formatSpeciesLabel(m.especie), formatBreedLabel(m.raza)].filter(Boolean).join(" · ")}
                            {edad !== null ? ` · ${edad} año${edad !== 1 ? "s" : ""}` : ""}
                          </p>
                        </div>
                      </Link>
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
                        className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
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
