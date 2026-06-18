import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, ArrowLeft, BedDouble, Calendar, Clock, HeartPulse, User, Phone, Thermometer, Droplets, ActivitySquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
import { getHospitalizacionById } from "../actions";
import { NuevoControlDialog } from "../nuevo-control-dialog";
import { AltaHospitalizacionDialog } from "../alta-hospitalizacion-dialog";
import { AlertasCriticasBanner } from "@/components/alertas-criticas-banner";
import { TratamientosHospitalizacionCard } from "../tratamientos-hospitalizacion-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detalle de Hospitalización | VetERP",
  description: "Detalle de internamiento y timeline de controles",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });
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

export default async function HospitalizacionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getHospitalizacionById(id);

  if ((result as any).notFound) {
    notFound();
  }

  if (result.error || !result.data) {
    return (
      <div className="space-y-4">
        <Link href="/hospitalizaciones" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 text-muted-foreground" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a hospitalizaciones
        </Link>
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              No se pudo cargar el detalle
            </CardTitle>
            <CardDescription>{result.error ?? "Error inesperado al cargar la hospitalizacion."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hospitalizacion = result.data;
  const mascota = hospitalizacion.mascotas as any;
  const cliente = hospitalizacion.clientes as any;
  const controles = hospitalizacion.hospitalizacion_controles || [];
  const tratamientos = (hospitalizacion as any).hospitalizacion_tratamientos || [];
  const isActiva = hospitalizacion.estado_text === "activa";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link href="/hospitalizaciones" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 mb-2 text-muted-foreground" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a hospitalizaciones
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Detalle de Hospitalización</h1>
            {getEstadoBadge(hospitalizacion.estado_text)}
          </div>
          <p className="text-sm text-muted-foreground">
            Ingreso: {formatDateTime(hospitalizacion.internado_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/mascotas/${hospitalizacion.mascota_id}?tab=hospitalizaciones`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver paciente
          </Link>
          {isActiva && (
            <>
              <NuevoControlDialog
                hospitalizacionId={hospitalizacion.id}
                mascotaId={hospitalizacion.mascota_id}
                pacienteNombre={mascota?.nombre ?? "Paciente"}
              />
              <AltaHospitalizacionDialog
                hospitalizacionId={hospitalizacion.id}
                pacienteNombre={mascota?.nombre ?? "Paciente"}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary" />
                Datos del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg flex items-center gap-2">
                  {mascota?.nombre ?? "Desconocido"}
                  {mascota?.codigo_text?.trim() && (
                    <Badge variant="outline">#{mascota.codigo_text}</Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatSpeciesLabel(mascota?.especie)} / {formatBreedLabel(mascota?.raza)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-foreground">{cliente?.nombre ?? "Sin responsable"}</span>
                </div>
                {cliente?.telefono && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{cliente.telefono}</span>
                  </div>
                )}
              </div>
              
              <AlertasCriticasBanner alertas={mascota?.alertas_criticas} />
              
              {mascota?.notas_manejo?.trim() && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                  <p className="font-semibold text-xs uppercase tracking-wider mb-1">Notas de manejo</p>
                  <p className="whitespace-pre-wrap">{mascota.notas_manejo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary" />
                Datos Clínicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Médico Tratante</p>
                <p className="mt-1 font-medium">{hospitalizacion.medico_tratante_text || "No especificado"}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Motivo</p>
                <p className="mt-1 whitespace-pre-wrap">{hospitalizacion.motivo_text || "Sin motivo registrado"}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diagnóstico Presuntivo</p>
                <p className="mt-1 whitespace-pre-wrap">{hospitalizacion.diagnostico_presuntivo_text || "No especificado"}</p>
              </div>

              {!isActiva && hospitalizacion.alta_at && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-900 mt-4">
                  <p className="font-semibold text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ActivitySquare className="h-3 w-3" />
                    Información de Alta
                  </p>
                  <p className="text-xs text-emerald-800/80 mb-2">{formatDateTime(hospitalizacion.alta_at)}</p>
                  {hospitalizacion.alta_notas_text ? (
                    <p className="whitespace-pre-wrap text-sm">{hospitalizacion.alta_notas_text}</p>
                  ) : (
                    <p className="text-sm italic">Sin notas de alta.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <TratamientosHospitalizacionCard
            hospitalizacionId={hospitalizacion.id}
            mascotaId={hospitalizacion.mascota_id}
            pacienteNombre={mascota?.nombre ?? "Paciente"}
            estadoHospitalizacion={hospitalizacion.estado_text}
            tratamientos={tratamientos}
          />
          {(hospitalizacion as any).tratamientosFeatureUnavailable ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {(hospitalizacion as any).tratamientosFeatureReason}
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ActivitySquare className="h-4 w-4 text-primary" />
                  Timeline de Controles
                </span>
                <Badge variant="secondary">{controles.length} registros</Badge>
              </CardTitle>
              <CardDescription>
                Registro de signos vitales y observaciones durante el internamiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {controles.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center">
                  <HeartPulse className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium">Todavía no hay controles registrados.</p>
                  {isActiva && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Usa el botón "Registrar control" para añadir el primer registro.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                  {controles.map((control: any) => {
                    const hasVitals = control.temperatura_num || control.frecuencia_cardiaca_num || control.frecuencia_respiratoria_num || control.peso_num;
                    const hasPhysiological = control.deshidratacion_pct || control.mucosas_text || control.tlc_text;
                    const hasNeeds = control.comio_bool || control.orino_bool || control.defeco_bool;
                    
                    return (
                      <div key={control.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted-foreground/10 text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <ActivitySquare className="h-4 w-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-primary">
                              {format(new Date(control.registrado_at), "HH:mm", { locale: es })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(control.registrado_at), "dd MMM yyyy", { locale: es })}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {hasVitals && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {control.temperatura_num && <span className="bg-muted px-2 py-1 rounded flex items-center gap-1"><Thermometer className="h-3 w-3" /> {control.temperatura_num} °C</span>}
                                {control.frecuencia_cardiaca_num && <span className="bg-muted px-2 py-1 rounded flex items-center gap-1"><HeartPulse className="h-3 w-3 text-red-500" /> {control.frecuencia_cardiaca_num} lpm</span>}
                                {control.frecuencia_respiratoria_num && <span className="bg-muted px-2 py-1 rounded">🫁 {control.frecuencia_respiratoria_num} rpm</span>}
                                {control.peso_num && <span className="bg-muted px-2 py-1 rounded">⚖️ {control.peso_num} kg</span>}
                              </div>
                            )}

                            {hasPhysiological && (
                              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                                {control.deshidratacion_pct && <span><span className="font-medium text-foreground">Deshidratación:</span> {control.deshidratacion_pct}%</span>}
                                {control.mucosas_text && <span><span className="font-medium text-foreground">Mucosas:</span> {control.mucosas_text}</span>}
                                {control.tlc_text && <span><span className="font-medium text-foreground">TLC:</span> {control.tlc_text}</span>}
                              </div>
                            )}

                            {hasNeeds && (
                              <div className="flex gap-2">
                                {control.comio_bool && <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200">Comió</Badge>}
                                {control.orino_bool && <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">Orinó</Badge>}
                                {control.defeco_bool && <Badge variant="outline" className="text-[10px] h-5 bg-stone-50 text-stone-700 border-stone-200">Defecó</Badge>}
                              </div>
                            )}

                            {control.observaciones_text && (
                              <div className="mt-2 text-sm whitespace-pre-wrap bg-muted/30 p-2 rounded border border-muted">
                                {control.observaciones_text}
                              </div>
                            )}
                          </div>
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
    </div>
  );
}
