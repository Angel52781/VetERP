import Link from "next/link";
import { differenceInYears, format } from "date-fns";
import { es } from "date-fns/locale";
import { PawPrint, Search, User } from "lucide-react";

import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import { NuevaAtencionForm } from "../index/nueva-atencion-form";
import { AgendarCitaPacienteBtn } from "./agendar-cita-paciente-btn";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";

export const dynamic = "force-dynamic";

type PacientesPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function PacientesPage({ searchParams }: PacientesPageProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const q = query.toLowerCase();

  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();
  const now = new Date();
  const nowIso = now.toISOString();

  const [{ data: mascotas }, { data: tiposCita }] = await Promise.all([
    supabase
      .from("mascotas")
      .select(`
        id, nombre, especie, raza, nacimiento, cliente_id,
        clientes:cliente_id ( id, nombre )
      `)
      .eq("clinica_id", clinicaId)
      .order("nombre"),
    supabase
      .from("tipo_citas")
      .select("id, nombre, duracion_min")
      .eq("clinica_id", clinicaId)
      .order("nombre"),
  ]);

  const mascotasFiltradas = (mascotas ?? []).filter((mascota: any) => {
    if (!q) return true;
    const nombrePaciente = (mascota.nombre ?? "").toLowerCase();
    const nombreResponsable = ((mascota.clientes as any)?.nombre ?? "").toLowerCase();
    return nombrePaciente.includes(q) || nombreResponsable.includes(q);
  });

  const mascotaIds = mascotasFiltradas.map((m: any) => m.id).filter(Boolean);

  const [citasRes, ordenesRes] = mascotaIds.length
    ? await Promise.all([
        supabase
          .from("citas")
          .select("id, mascota_id, start_date, estado")
          .eq("clinica_id", clinicaId)
          .in("mascota_id", mascotaIds)
          .gte("start_date", nowIso)
          .order("start_date", { ascending: true }),
        supabase
          .from("ordenes_servicio")
          .select("id, mascota_id, created_at")
          .eq("clinica_id", clinicaId)
          .in("mascota_id", mascotaIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const proximaCitaByMascota = new Map<string, any>();
  for (const cita of citasRes.data ?? []) {
    if (["cancelada", "no_asistio", "completada"].includes(cita.estado)) continue;
    if (!proximaCitaByMascota.has(cita.mascota_id)) {
      proximaCitaByMascota.set(cita.mascota_id, cita);
    }
  }

  const ultimaAtencionByMascota = new Map<string, any>();
  for (const orden of ordenesRes.data ?? []) {
    if (!ultimaAtencionByMascota.has(orden.mascota_id)) {
      ultimaAtencionByMascota.set(orden.mascota_id, orden);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {mascotasFiltradas.length} paciente{mascotasFiltradas.length !== 1 ? "s" : ""} en vista operativa
          </p>
        </div>
        <form className="flex w-full max-w-xl items-center gap-2" method="get">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Buscar por nombre de paciente o responsable"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Buscar</Button>
          {query ? (
            <Link href="/pacientes" className={buttonVariants({ variant: "ghost" })}>
              Limpiar
            </Link>
          ) : null}
        </form>
      </div>

      {!mascotasFiltradas.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-3">
          <PawPrint className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No hay pacientes para mostrar</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajusta la búsqueda o registra pacientes desde el módulo de clientes.
            </p>
          </div>
          <Link href="/clientes" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ir a Clientes
          </Link>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {mascotasFiltradas.map((mascota: any) => {
            const responsable = mascota.clientes as any;
            const edad = mascota.nacimiento
              ? `${Math.max(0, differenceInYears(now, new Date(mascota.nacimiento)))} año${Math.max(0, differenceInYears(now, new Date(mascota.nacimiento))) === 1 ? "" : "s"}`
              : "Edad no registrada";
            const proximaCita = proximaCitaByMascota.get(mascota.id);
            const ultimaAtencion = ultimaAtencionByMascota.get(mascota.id);

            return (
              <div key={mascota.id} className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <PawPrint className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{mascota.nombre}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                        {formatSpeciesLabel(mascota.especie)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatBreedLabel(mascota.raza)} · {edad}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {responsable?.nombre || "Responsable no disponible"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Próxima cita</p>
                    <p className="text-xs">
                      {proximaCita
                        ? format(new Date(proximaCita.start_date), "dd MMM yyyy HH:mm", { locale: es })
                        : "Sin cita próxima"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Última atención</p>
                    <p className="text-xs">
                      {ultimaAtencion
                        ? format(new Date(ultimaAtencion.created_at), "dd MMM yyyy", { locale: es })
                        : "Sin atenciones"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <Link
                    href={`/mascotas/${mascota.id}?returnTo=${encodeURIComponent("/pacientes")}`}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "h-8" })}
                  >
                    Ver ficha
                  </Link>
                  <NuevaAtencionForm
                    clientes={[
                      {
                        id: mascota.cliente_id,
                        nombre: responsable?.nombre || "Responsable",
                      },
                    ]}
                    initialClienteId={mascota.cliente_id}
                    initialMascotaId={mascota.id}
                    triggerVariant="outline"
                    triggerSize="sm"
                    triggerClassName="h-8"
                  />
                  <AgendarCitaPacienteBtn
                    clienteId={mascota.cliente_id}
                    clienteNombre={responsable?.nombre || "Responsable"}
                    mascotaId={mascota.id}
                    tiposCita={tiposCita || []}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
