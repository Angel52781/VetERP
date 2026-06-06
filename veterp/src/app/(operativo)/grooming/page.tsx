import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Scissors, CalendarDays, Inbox } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getGroomingStatusMeta } from "@/lib/operational-status";
import { getGroomingDia } from "./actions";
import { GroomingCard } from "./grooming-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Grooming | VetERP",
  description: "Baños, cortes, grooming y servicios relacionados",
};

export default async function GroomingPage() {
  const hoy = new Date();
  const { data: citas, error } = await getGroomingDia();

  const pendientes = citas.filter(
    (c: any) => c.grooming_servicios?.[0]?.estado_text !== "completado"
  );
  const completados = citas.filter(
    (c: any) => c.grooming_servicios?.[0]?.estado_text === "completado"
  );
  const pendientesMeta = getGroomingStatusMeta("pendiente");
  const completadosMeta = getGroomingStatusMeta("completado");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Scissors className="h-6 w-6 text-primary" />
            Grooming
          </h1>
          <p className="text-sm text-muted-foreground">
            Baños, cortes, grooming y servicios relacionados - {format(hoy, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <Link href="/agenda" className={buttonVariants({ variant: "default", className: "w-full sm:w-auto" })}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Programar en Agenda
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error cargando servicios: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{citas.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total hoy</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendientes.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pendientes</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{completados.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completados</p>
        </div>
      </div>

      {citas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-3">
          <Inbox className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-sm">Sin servicios de baño o grooming para hoy</p>
            <p className="text-xs text-muted-foreground mt-1">
              Programa los servicios desde{" "}
              <Link href="/agenda" className="text-primary underline">
                Agenda
              </Link>
              , usando un tipo de cita con área &quot;Baños&quot; o &quot;Grooming&quot;.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pendientes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {pendientesMeta.label} ({pendientes.length})
              </h2>
              <div className="space-y-3">
                {pendientes.map((cita: any) => (
                  <GroomingCard key={cita.id} cita={cita} />
                ))}
              </div>
            </section>
          )}

          {completados.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {completadosMeta.label} ({completados.length})
              </h2>
              <div className="space-y-3">
                {completados.map((cita: any) => (
                  <GroomingCard key={cita.id} cita={cita} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t pt-4">
        Nota operativa: marcar un servicio de grooming como completado no implica cobro registrado;
        el cobro se gestiona en Caja / Cobro.
      </p>
      <p className="text-xs text-muted-foreground">
        Próximas fases: historial de grooming por paciente, consumo de productos,
        fotos antes/después, combos y descuentos.
      </p>
    </div>
  );
}
