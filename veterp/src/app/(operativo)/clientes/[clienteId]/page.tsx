import Link from "next/link";
import { notFound } from "next/navigation";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, Mail, ArrowLeft, PawPrint, CalendarDays, Clock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

import MascotaForm from "./mascota-form";

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

  // Deuda del cliente
  const { data: ventas } = await supabase
    .from("ventas")
    .select(`
      estado,
      total,
      ledger ( monto )
    `)
    .eq("clinica_id", clinicaId)
    .eq("cliente_id", clienteId)
    .neq("estado", "pagada");

  const deudaTotal = (ventas || []).reduce((acc, v) => {
    const pagado = v.ledger.reduce((pAcc: number, l: any) => pAcc + Number(l.monto), 0);
    return acc + Math.max(0, Number(v.total) - pagado);
  }, 0);

  const estadoOrden: Record<string, { label: string; cls: string }> = {
    open:        { label: "En espera",   cls: "bg-amber-100 text-amber-800" },
    in_progress: { label: "En atención", cls: "bg-blue-100 text-blue-800" },
    finished:    { label: "Finalizada",  cls: "bg-green-100 text-green-800" },
    closed:      { label: "Cerrada",     cls: "bg-secondary text-secondary-foreground" },
  };

  const now = new Date();

  return (
    <div className="space-y-6">
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
        <div className="flex flex-col items-end gap-2">
          <Link href="/clientes" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver a Clientes
          </Link>
          <div className="flex gap-2 mt-2">
            <Link href={`/atenciones`} className={buttonVariants({ size: "sm" })}>
              <Clock className="mr-1.5 h-4 w-4" />
              Nueva Atención
            </Link>
            <Link href={`/agenda`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <CalendarDays className="mr-1.5 h-4 w-4" />
              Agendar Cita
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Mascotas Totales</p>
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
              ${deudaTotal.toFixed(2)}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mascotas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PawPrint className="h-4 w-4" />
                Mascotas ({mascotas?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!mascotas?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin mascotas registradas. Usa el formulario para agregar una.
                </p>
              ) : (
                <div className="divide-y">
                  {mascotas.map((m) => {
                    const edad = m.nacimiento
                      ? differenceInYears(now, new Date(m.nacimiento))
                      : null;
                    return (
                      <Link key={m.id} href={`/mascotas/${m.id}`} className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors group">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <PawPrint className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{m.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {[m.especie, m.raza].filter(Boolean).join(" · ") || "Sin especie"}
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
                        href={`/orden_y_colas/${o.id}`}
                        className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            Orden ORD-{o.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(o.mascotas as any)?.nombre ?? "Sin mascota"} ·{" "}
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

        {/* Sidebar: citas próximas + agregar mascota */}
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

          {/* Agregar mascota */}
          <MascotaForm clienteId={clienteId} />
        </div>
      </div>
    </div>
  );
}
