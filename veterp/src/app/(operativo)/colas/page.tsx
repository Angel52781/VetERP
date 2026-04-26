import { differenceInMinutes } from "date-fns";
import { Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ColasPage() {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  // Colas: órdenes abiertas (open = sala de espera) o en progreso (in_progress = en atención)
  // ordenadas por started_at asc → las más antiguas primero
  const { data: ordenes, error } = await supabase
    .from("ordenes_servicio")
    .select(
      `id, estado_text, started_at, created_at,
       clientes:cliente_id (id, nombre),
       mascotas:mascota_id (id, nombre)`
    )
    .eq("clinica_id", clinicaId)
    .in("estado_text", ["open", "in_progress"])
    .order("started_at", { ascending: true });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Colas</h1>
        <Card>
          <CardHeader>
            <CardTitle>Error al cargar colas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error.message}</CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const enEspera = (ordenes ?? []).filter((o) => o.estado_text === "open");
  const enAtencion = (ordenes ?? []).filter((o) => o.estado_text === "in_progress");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sala de Espera (Colas)</h1>
        <p className="text-sm text-muted-foreground">
          Vista en vivo de pacientes esperando consulta y pacientes siendo atendidos en consultorio.
        </p>
        <p className="text-xs text-muted-foreground italic mt-1">
          Nota: Próximamente se añadirán carriles de Hospitalización y Peluquería.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              En espera
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{enEspera.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              En atención
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{enAtencion.length}</CardContent>
        </Card>
      </div>

      {/* En espera */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">En espera</h2>
        {enEspera.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pacientes en espera.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {enEspera.map((orden, i) => {
              const minutosEspera = orden.started_at
                ? differenceInMinutes(now, new Date(orden.started_at))
                : null;
              return (
                <div
                  key={orden.id}
                  className="flex items-center justify-between px-4 py-3 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg font-bold text-muted-foreground w-6 shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {(orden.mascotas as any)?.nombre ?? "Sin mascota"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(orden.clientes as any)?.nombre ?? "Sin cliente"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {minutosEspera !== null && (
                      <Badge variant={minutosEspera > 30 ? "destructive" : "secondary"}>
                        {minutosEspera} min
                      </Badge>
                    )}
                    <Link
                      href={`/orden_y_colas/${orden.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* En atención */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">En atención</h2>
        {enAtencion.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pacientes en atención activa.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {enAtencion.map((orden) => {
              const minutosAtencion = orden.started_at
                ? differenceInMinutes(now, new Date(orden.started_at))
                : null;
              return (
                <div
                  key={orden.id}
                  className="flex items-center justify-between px-4 py-3 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {(orden.mascotas as any)?.nombre ?? "Sin mascota"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(orden.clientes as any)?.nombre ?? "Sin cliente"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {minutosAtencion !== null && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        {minutosAtencion} min en consulta
                      </Badge>
                    )}
                    <Link
                      href={`/orden_y_colas/${orden.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
