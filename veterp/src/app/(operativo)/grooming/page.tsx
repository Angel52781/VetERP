import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Scissors, CalendarDays, ShoppingBag, Info } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Grooming | VetERP",
  description: "Baños, cortes, grooming y servicios relacionados",
};

export default async function GroomingPage() {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const hoy = new Date();
  const inicioHoy = startOfDay(hoy).toISOString();
  const finHoy = endOfDay(hoy).toISOString();

  // Citas de hoy cuyo tipo_cita pertenece a área banos o grooming
  const { data: citasGrooming } = await supabase
    .from("citas")
    .select(
      `id, start_date, end_date, estado,
       clientes:cliente_id (nombre),
       mascotas:mascota_id (nombre),
       tipo_citas:tipo_cita_id (nombre, color, area)`
    )
    .eq("clinica_id", clinicaId)
    .gte("start_date", inicioHoy)
    .lte("start_date", finHoy)
    .not("estado", "in", '("cancelada","no_asistio")')
    .order("start_date", { ascending: true });

  // Filtrar solo las de área banos o grooming (en cliente para evitar join complejo)
  const citasFiltradas = (citasGrooming ?? []).filter(
    (c: any) => c.tipo_citas?.area === "banos" || c.tipo_citas?.area === "grooming"
  );

  const estadoLabels: Record<string, string> = {
    programada: "Programada",
    confirmada: "Confirmada",
    llego: "Llegó",
    en_atencion: "En servicio",
    completada: "Completada",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Grooming
          </h1>
          <p className="text-sm text-muted-foreground">
            Baños, cortes, grooming y servicios relacionados —{" "}
            {format(hoy, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <Link href="/agenda" className={buttonVariants({ variant: "default" })}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Programar en Agenda
        </Link>
      </div>

      {/* Aviso de módulo en construcción */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardHeader className="pb-2 flex flex-row items-center gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Módulo operativo en construcción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Por ahora, programa los servicios de baño/grooming desde{" "}
            <Link href="/agenda" className="font-semibold underline">
              Agenda
            </Link>{" "}
            y cobra desde{" "}
            <Link href="/caja" className="font-semibold underline">
              Caja
            </Link>{" "}
            /
            <Link href="/ajustes?tab=catalogo" className="font-semibold underline ml-1">
              Catálogo
            </Link>
            . El flujo operativo completo (cola de grooming, consumo de productos, historial de cortes) estará disponible en la siguiente fase.
          </p>
        </CardContent>
      </Card>

      {/* Citas de Baño / Grooming hoy */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Servicios de baño / grooming hoy{" "}
            {citasFiltradas.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({citasFiltradas.length})
              </span>
            )}
          </h2>
          <Link href="/agenda" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver agenda completa
          </Link>
        </div>

        {citasFiltradas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay servicios de baño o grooming programados para hoy.
            <br />
            <Link href="/agenda" className="mt-3 inline-block text-primary underline text-xs">
              Programar servicio en Agenda →
            </Link>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {citasFiltradas.map((cita: any) => (
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
                    <p className="font-medium text-sm truncate">
                      {cita.mascotas?.nombre ?? "Sin paciente"}
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
                    {estadoLabels[cita.estado] ?? cita.estado}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Accesos rápidos */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/agenda"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Agenda</p>
              <p className="text-xs text-muted-foreground">Programar cita de baño o grooming</p>
            </div>
          </Link>
          <Link
            href="/ajustes"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Catálogo de servicios</p>
              <p className="text-xs text-muted-foreground">Ver y editar precios de grooming</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
