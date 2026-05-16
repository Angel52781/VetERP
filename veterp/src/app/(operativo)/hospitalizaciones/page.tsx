import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Clock,
  HeartPulse,
  Phone,
  Stethoscope,
} from "lucide-react";

import { AlertasCriticasBanner } from "@/components/alertas-criticas-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
import { AltaHospitalizacionDialog } from "./alta-hospitalizacion-dialog";
import { getHospitalizaciones } from "./actions";
import { NuevaHospitalizacionDialog } from "./nueva-hospitalizacion-dialog";
import { NuevoControlDialog } from "./nuevo-control-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hospitalizaciones | VetERP",
  description: "Pacientes internados, controles básicos y alta",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });
}

function formatInternadoDesde(value: string) {
  return formatDistanceToNowStrict(new Date(value), { locale: es, addSuffix: false });
}

function formatOptionalNumber(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return null;
  return `${Number(value)}${suffix}`;
}

function getEstadoBadge(estado: string) {
  if (estado === "alta") {
    return <Badge className="bg-emerald-100 text-emerald-800 border-none">Alta</Badge>;
  }
  if (estado === "cancelada") {
    return <Badge variant="secondary">Cancelada</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800 border-none">Activa</Badge>;
}

function UltimoControl({ control }: { control: any }) {
  if (!control) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        Sin controles registrados todavía.
      </div>
    );
  }

  const vitals = [
    formatOptionalNumber(control.temperatura_num, " C"),
    formatOptionalNumber(control.frecuencia_cardiaca_num, " lpm"),
    formatOptionalNumber(control.frecuencia_respiratoria_num, " rpm"),
    formatOptionalNumber(control.peso_num, " kg"),
  ].filter(Boolean);

  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          Último control
        </p>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(control.registrado_at)}
        </span>
      </div>
      {vitals.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{vitals.join(" · ")}</p>
      )}
      {(control.comio_bool || control.orino_bool || control.defeco_bool) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {[
            control.comio_bool ? "Comió" : null,
            control.orino_bool ? "Orinó" : null,
            control.defeco_bool ? "Defecó" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {control.observaciones_text && (
        <p className="mt-2 text-xs whitespace-pre-wrap">{control.observaciones_text}</p>
      )}
    </div>
  );
}

export default async function HospitalizacionesPage() {
  const result = await getHospitalizaciones();
  const payload = result.data;
  const hospitalizaciones = payload?.hospitalizaciones ?? [];
  const pacientes = payload?.pacientes ?? [];
  const controlesHoy = payload?.controlesHoy ?? 0;
  const activas = hospitalizaciones.filter((h: any) => h.estado_text === "activa");
  const altasRecientes = hospitalizaciones
    .filter((h: any) => h.estado_text === "alta")
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BedDouble className="h-6 w-6 text-primary" />
            Hospitalizaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Pacientes internados, controles básicos y alta. Sin facturación ni medicación compleja en H1.
          </p>
        </div>
        <NuevaHospitalizacionDialog pacientes={pacientes as any} />
      </div>

      {result.error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error cargando hospitalizaciones: {result.error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <BedDouble className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-sm font-medium">Altas recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{altasRecientes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-medium">Controles hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{controlesHoy}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">Internados activos</h2>
          <Badge variant="outline">{activas.length} activo{activas.length === 1 ? "" : "s"}</Badge>
        </div>

        {activas.length === 0 ? (
          <div className="rounded-lg border border-dashed py-14 text-center">
            <BedDouble className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium">Sin pacientes internados activos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea un internamiento cuando el paciente requiera observación y controles.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activas.map((hospitalizacion: any) => {
              const mascota = hospitalizacion.mascotas;
              const cliente = hospitalizacion.clientes;
              return (
                <Card key={hospitalizacion.id} className="overflow-hidden">
                  <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg">
                            {mascota?.nombre ?? "Paciente no disponible"}
                          </CardTitle>
                          {mascota?.codigo_text?.trim() ? (
                            <Badge variant="outline">#{mascota.codigo_text}</Badge>
                          ) : null}
                          {getEstadoBadge(hospitalizacion.estado_text)}
                          {mascota?.alertas_criticas?.trim() && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Alerta
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {formatSpeciesLabel(mascota?.especie)} / {formatBreedLabel(mascota?.raza)}
                          {" · "}
                          Responsable: {cliente?.nombre ?? "Sin responsable"}
                          {cliente?.telefono ? ` · ${cliente.telefono}` : ""}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/hospitalizaciones/${hospitalizacion.id}`}
                          className={buttonVariants({ variant: "default", size: "sm" })}
                        >
                          Ver detalle
                        </Link>
                        <Link
                          href={`/mascotas/${hospitalizacion.mascota_id}?tab=hospitalizaciones&returnTo=${encodeURIComponent("/hospitalizaciones")}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Ver paciente
                        </Link>
                        <NuevoControlDialog
                          hospitalizacionId={hospitalizacion.id}
                          mascotaId={hospitalizacion.mascota_id}
                          pacienteNombre={mascota?.nombre ?? "Paciente"}
                        />
                        <AltaHospitalizacionDialog
                          hospitalizacionId={hospitalizacion.id}
                          pacienteNombre={mascota?.nombre ?? "Paciente"}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Tiempo internado
                        </p>
                        <p className="font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatInternadoDesde(hospitalizacion.internado_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Ingreso
                        </p>
                        <p>{formatDateTime(hospitalizacion.internado_at)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Médico tratante
                        </p>
                        <p>{hospitalizacion.medico_tratante_text || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Diagnóstico presuntivo
                        </p>
                        <p className="line-clamp-2">{hospitalizacion.diagnostico_presuntivo_text || "-"}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Motivo
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-wrap">
                            {hospitalizacion.motivo_text || "Sin motivo registrado"}
                          </p>
                        </div>
                        <AlertasCriticasBanner alertas={mascota?.alertas_criticas} />
                        {mascota?.notas_manejo?.trim() && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                            <p className="text-xs font-semibold uppercase tracking-wider">Notas de manejo</p>
                            <p className="mt-1 text-sm whitespace-pre-wrap">{mascota.notas_manejo}</p>
                          </div>
                        )}
                      </div>
                      <UltimoControl control={hospitalizacion.ultimo_control} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Altas recientes</h2>
        {altasRecientes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay altas recientes registradas.
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {altasRecientes.map((hospitalizacion: any) => (
              <div key={hospitalizacion.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{hospitalizacion.mascotas?.nombre ?? "Paciente"}</p>
                    {hospitalizacion.mascotas?.codigo_text?.trim() ? (
                      <Badge variant="outline">#{hospitalizacion.mascotas.codigo_text}</Badge>
                    ) : null}
                    {getEstadoBadge(hospitalizacion.estado_text)}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Responsable: {hospitalizacion.clientes?.nombre ?? "-"}
                    {hospitalizacion.clientes?.telefono && (
                      <span className="inline-flex items-center gap-1 ml-2">
                        <Phone className="h-3 w-3" />
                        {hospitalizacion.clientes.telefono}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Ingreso: {formatDateTime(hospitalizacion.internado_at)} · Alta:{" "}
                    {formatDateTime(hospitalizacion.alta_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                  <Link
                    href={`/hospitalizaciones/${hospitalizacion.id}`}
                    className={buttonVariants({ variant: "default", size: "sm" })}
                  >
                    Ver detalle
                  </Link>
                  <Link
                    href={`/mascotas/${hospitalizacion.mascota_id}?tab=hospitalizaciones&returnTo=${encodeURIComponent("/hospitalizaciones")}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Ver paciente
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="border-t pt-4 text-xs text-muted-foreground flex items-start gap-2">
        <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        H1 no registra medicación compleja, facturación automática ni consumo de inventario.
        Esos flujos quedan para fases posteriores.
      </p>
    </div>
  );
}
