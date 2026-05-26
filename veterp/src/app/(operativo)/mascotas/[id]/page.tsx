import { notFound } from "next/navigation";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { BtnNuevaAtencion } from "./btn-nueva-atencion";
import { getMascotaCompleta } from "./actions";
import { SeguimientosCard } from "./seguimientos-card";
import { MascotaEditDialog } from "./mascota-edit-dialog";
import { AgendarCitaPacienteBtn } from "@/app/(operativo)/pacientes/agendar-cita-paciente-btn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Calendar, ArrowLeft, NotebookPen, Phone, User,
  Stethoscope, FileText, AlertCircle, Scissors,
  BedDouble, FlaskConical, Syringe, FolderOpen, Activity,
  CheckCircle2,
} from "lucide-react";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
import { AlertasCriticasBanner } from "@/components/alertas-criticas-banner";
import { formatDateOnly, getAgeFromDateOnly } from "@/lib/date-only";

const CITA_ESTADO_META: Record<string, { label: string; className: string }> = {
  programada: { label: "Programada", className: "bg-blue-100 text-blue-800" },
  confirmada: { label: "Confirmada", className: "bg-indigo-100 text-indigo-800" },
  llego: { label: "Llegó", className: "bg-amber-100 text-amber-800" },
  en_atencion: { label: "En atención", className: "bg-purple-100 text-purple-800" },
  completada: { label: "Completada", className: "bg-green-100 text-green-800" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-800" },
  no_asistio: { label: "No asistió", className: "bg-orange-100 text-orange-800" },
};

const ORDEN_ESTADO: Record<string, { label: string; cls: string }> = {
  open: { label: "En espera", cls: "bg-amber-100 text-amber-800" },
  in_progress: { label: "En atención", cls: "bg-blue-100 text-blue-800" },
  finished: { label: "Finalizada", cls: "bg-green-100 text-green-800" },
  closed: { label: "Cerrada", cls: "bg-muted text-muted-foreground" },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string; tab?: string }>;
}

export default async function MascotaProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { returnTo, tab } = (await searchParams) ?? {};
  const {
    mascota, ordenes, citas, tiposCita, seguimientos, hospitalizaciones,
    seguimientoFeatureUnavailable, seguimientoFeatureReason, error,
  } = await getMascotaCompleta(id);

  if (!mascota) notFound();

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  const nextCita = citas?.find(
    (c) => new Date(c.start_date) > now && !["cancelada", "no_asistio", "completada"].includes(c.estado)
  );
  const lastOrden = ordenes?.[0];
  const activeOrden = ordenes?.find((o) => ["open", "in_progress"].includes(o.estado_text));

  const ageYears = getAgeFromDateOnly(mascota.nacimiento, now);
  const ageString = ageYears === null ? null : `${ageYears} años`;
  const birthDateString = formatDateOnly(mascota.nacimiento);

  const rawEntradas = ordenes?.flatMap((o) => o.entradas_clinicas || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  const soapSeen = new Set<string>();
  const allEntradas = rawEntradas.filter((e: any) => {
    const isSOAP = e.tipo_text === "Nota Clínica de Evolución" || e.tipo_text === "Signos Vitales y Triaje";
    if (isSOAP) {
      if (soapSeen.has(e.orden_id)) return false;
      soapSeen.add(e.orden_id);
    }
    return true;
  });

  const ultimoDiagnostico = allEntradas.find((e: any) => e.diagnostico_text?.trim())?.diagnostico_text;

  const safeReturnTo = typeof returnTo === "string" && returnTo.startsWith("/")
    ? returnTo
    : `/clientes/${mascota.cliente_id}`;
  const ordenReturnTo = encodeURIComponent(`/mascotas/${id}`);
  const defaultTab =
    tab === "seguimientos"
      ? "seguimientos"
      : tab === "hospitalizaciones"
        ? "hospitalizaciones"
        : tab === "ordenes"
          ? "ordenes"
          : tab === "citas"
            ? "citas"
            : "historia";

  const responsable = mascota.clientes as any;

  // Recordatorios pendientes
  const nowDay = startOfDay(now);
  const recordatoriosPendientes = (seguimientos ?? []).filter((s: any) =>
    s.proxima_fecha_date && s.estado_text !== "resuelto" && s.estado_text !== "cancelado"
  ).sort((a: any, b: any) => a.proxima_fecha_date.localeCompare(b.proxima_fecha_date));

  const getSegStatus = (proxima: string | null, estado?: string | null) => {
    if (estado === "resuelto") return { label: "Resuelto", cls: "bg-emerald-100 text-emerald-800" };
    if (estado === "cancelado") return { label: "Cancelado", cls: "bg-muted text-muted-foreground" };
    if (!proxima) return { label: "Al día", cls: "bg-emerald-100 text-emerald-800" };
    const d = parseISO(proxima);
    if (isBefore(d, nowDay)) return { label: "Vencido", cls: "bg-red-100 text-red-800" };
    const diff = Math.ceil((d.getTime() - nowDay.getTime()) / 86400000);
    if (diff <= 7) return { label: `Próximo (${diff}d)`, cls: "bg-orange-100 text-orange-800" };
    if (diff <= 30) return { label: "Próximo (30d)", cls: "bg-blue-100 text-blue-800" };
    return { label: "Al día", cls: "bg-emerald-100 text-emerald-800" };
  };

  const hospitalizacionesOrdenadas = [...(hospitalizaciones ?? [])].sort((a: any, b: any) => {
    const estadoDelta = Number(b.estado_text === "activa") - Number(a.estado_text === "activa");
    if (estadoDelta !== 0) return estadoDelta;
    return new Date(b.internado_at).getTime() - new Date(a.internado_at).getTime();
  });
  const hospitalizacionActiva = hospitalizacionesOrdenadas.find((h: any) => h.estado_text === "activa");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Back */}
      <Link href={safeReturnTo} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Link>

      {/* ── HEADER ── */}
      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Identity */}
          <div className="flex min-w-0 items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold tracking-tight">{mascota.nombre}</h1>
                {mascota.codigo_text?.trim() && (
                  <Badge variant="outline">#{mascota.codigo_text}</Badge>
                )}
                <Badge variant="secondary">{formatSpeciesLabel(mascota.especie)}</Badge>
                {activeOrden && (
                  <Badge className="bg-blue-100 text-blue-800 border-none">En atención</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatBreedLabel(mascota.raza)}
                {ageString && ` · ${ageString}`}
                {mascota.nacimiento && ` · Nac. ${birthDateString}`}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Responsable:{" "}
                <Link href={`/clientes/${mascota.cliente_id}`} className="hover:underline text-foreground font-medium ml-1">
                  {responsable?.nombre ?? "—"}
                </Link>
                {responsable?.telefono && (
                  <span className="flex items-center gap-1 ml-2">
                    <Phone className="h-3.5 w-3.5" /> {responsable.telefono}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <BtnNuevaAtencion clienteId={mascota.cliente_id} mascotaId={mascota.id} compact label="Nueva atención" />
            <AgendarCitaPacienteBtn
              clienteId={mascota.cliente_id}
              clienteNombre={responsable?.nombre ?? "Responsable"}
              mascotaId={mascota.id}
              tiposCita={tiposCita ?? []}
            />
            <MascotaEditDialog mascota={{
              ...mascota,
              alertas_criticas: mascota.alertas_criticas ?? null,
              notas_manejo: mascota.notas_manejo ?? null,
            }} />
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 border-t pt-1 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Atenciones</p>
            <p className="text-xl font-bold">{ordenes?.length ?? 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Seguimientos</p>
            <p className="text-xl font-bold">{seguimientos?.length ?? 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Últ. diagnóstico</p>
            <p className="text-xs font-medium truncate mt-1" title={ultimoDiagnostico ?? undefined}>
              {ultimoDiagnostico ? ultimoDiagnostico.slice(0, 30) + (ultimoDiagnostico.length > 30 ? "…" : "") : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Próxima cita</p>
            <p className="text-xs font-medium mt-1">
              {nextCita ? format(new Date(nextCita.start_date), "dd MMM, HH:mm", { locale: es }) : "Sin cita"}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas críticas */}
      <AlertasCriticasBanner alertas={mascota.alertas_criticas} />

      {/* Notas de manejo */}
      {mascota.notas_manejo?.trim() && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
          <NotebookPen className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Notas de manejo</p>
            <p className="text-sm text-amber-800 mt-0.5 whitespace-pre-wrap break-words">{mascota.notas_manejo}</p>
          </div>
        </div>
      )}

      {/* ── 2-col quick summary ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Responsable card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Responsable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              <Link href={`/clientes/${mascota.cliente_id}`} className="hover:underline text-primary">
                {responsable?.nombre ?? "—"}
              </Link>
            </p>
            {responsable?.telefono && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {responsable.telefono}
              </p>
            )}
            {responsable?.email && (
              <p className="text-muted-foreground">{responsable.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Recordatorios pendientes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Recordatorios pendientes
              {recordatoriosPendientes.length > 0 && (
                <Badge variant="secondary">{recordatoriosPendientes.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordatoriosPendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sin recordatorios pendientes
              </p>
            ) : (
              <div className="space-y-2">
                {recordatoriosPendientes.slice(0, 4).map((s: any) => {
                  const st = getSegStatus(s.proxima_fecha_date, s.estado_text);
                  return (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.nombre_text}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.proxima_fecha_date
                            ? format(parseISO(s.proxima_fecha_date), "dd/MM/yyyy")
                            : "Sin fecha"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
                {recordatoriosPendientes.length > 4 && (
                  <p className="text-xs text-muted-foreground">+{recordatoriosPendientes.length - 4} más…</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── TABS ── */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex w-full min-w-0 overflow-x-auto sm:grid sm:grid-cols-5">
          <TabsTrigger value="historia" className="min-w-[10rem] sm:min-w-0">Historia clínica</TabsTrigger>
          <TabsTrigger value="seguimientos" className="min-w-[9rem] sm:min-w-0">Seguimientos</TabsTrigger>
          <TabsTrigger value="hospitalizaciones" className="min-w-[10rem] sm:min-w-0">Hospitalizaciones</TabsTrigger>
          <TabsTrigger value="ordenes" className="min-w-[8rem] sm:min-w-0">Atenciones</TabsTrigger>
          <TabsTrigger value="citas" className="min-w-[7rem] sm:min-w-0">Citas</TabsTrigger>
        </TabsList>

        {/* Historia clínica */}
        <TabsContent value="historia" className="mt-4 space-y-4">
          {allEntradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-card">
              <FileText className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Sin registros clínicos para este paciente.</p>
              <BtnNuevaAtencion clienteId={mascota.cliente_id} mascotaId={mascota.id} compact label="Iniciar atención" />
            </div>
          ) : (
            allEntradas.map((e: any) => {
              const isSOAP = e.tipo_text === "Nota Clínica de Evolución" || e.tipo_text === "Signos Vitales y Triaje";
              return (
                <Card key={e.id} className="overflow-hidden">
                  <div className="flex flex-col gap-2 border-b bg-muted/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">
                        {e.motivo_consulta_text ? `Consulta: ${e.motivo_consulta_text}` : e.tipo_text}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(e.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {(e.peso_kg_num || e.temperatura_c_num || e.frecuencia_cardiaca_num || e.frecuencia_respiratoria_num) && (
                      <div className="flex flex-wrap gap-2 border-b border-dashed pb-3 text-xs">
                        {e.peso_kg_num && <span className="bg-secondary/30 rounded px-2 py-0.5">⚖️ {e.peso_kg_num} kg</span>}
                        {e.temperatura_c_num && <span className="bg-secondary/30 rounded px-2 py-0.5">🌡️ {e.temperatura_c_num} °C</span>}
                        {e.frecuencia_cardiaca_num && <span className="bg-secondary/30 rounded px-2 py-0.5">❤️ {e.frecuencia_cardiaca_num} lpm</span>}
                        {e.frecuencia_respiratoria_num && <span className="bg-secondary/30 rounded px-2 py-0.5">🫁 {e.frecuencia_respiratoria_num} rpm</span>}
                      </div>
                    )}
                    {isSOAP ? (
                      <div className="space-y-3">
                        {e.anamnesis_text && <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">Anamnesis</p><p className="text-sm bg-muted/20 p-2 rounded">{e.anamnesis_text}</p></div>}
                        {e.observaciones_text && <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">Examen físico</p><p className="text-sm bg-muted/20 p-2 rounded">{e.observaciones_text}</p></div>}
                        {e.diagnostico_text && <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">Diagnóstico</p><p className="text-sm font-medium text-primary bg-primary/5 p-2 rounded">{e.diagnostico_text}</p></div>}
                        {e.plan_tratamiento_text && <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">Plan terapéutico</p><p className="text-sm bg-emerald-50/50 p-2 rounded border border-emerald-200">{e.plan_tratamiento_text}</p></div>}
                      </div>
                    ) : (
                      e.texto_text && <p className="text-sm whitespace-pre-wrap">{e.texto_text}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Seguimientos */}
        <TabsContent value="seguimientos" className="mt-4">
          <SeguimientosCard
            mascotaId={id}
            seguimientos={seguimientos || []}
            featureUnavailable={seguimientoFeatureUnavailable}
            featureUnavailableReason={seguimientoFeatureReason ?? undefined}
          />
        </TabsContent>

        {/* Hospitalizaciones */}
        <TabsContent value="hospitalizaciones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary" />
                Hospitalizaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hospitalizacionesOrdenadas.length > 0 ? (
                <div className="space-y-4">
                  {hospitalizacionActiva ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <BedDouble className="h-4 w-4" />
                            Hospitalización activa
                          </p>
                          <p className="mt-1 text-xs text-blue-800">
                            Ingreso:{" "}
                            {format(new Date(hospitalizacionActiva.internado_at), "dd MMM yyyy, HH:mm", {
                              locale: es,
                            })}
                          </p>
                          {hospitalizacionActiva.diagnostico_presuntivo_text && (
                            <p className="mt-1 text-xs text-blue-800 line-clamp-2">
                              {hospitalizacionActiva.diagnostico_presuntivo_text}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/hospitalizaciones/${hospitalizacionActiva.id}`}
                          className={buttonVariants({ variant: "default", size: "sm" })}
                        >
                          Ver hospitalización activa
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  <div className="divide-y rounded-md border">
                    {hospitalizacionesOrdenadas.map((hospitalizacion: any) => {
                    const isActiva = hospitalizacion.estado_text === "activa";
                    const ultimoControl = hospitalizacion.ultimo_control;
                    return (
                      <div key={hospitalizacion.id} className="p-4 space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">
                                {hospitalizacion.diagnostico_presuntivo_text || "Internamiento"}
                              </p>
                              <Badge
                                className={
                                  isActiva
                                    ? "bg-blue-100 text-blue-800 border-none"
                                    : "bg-emerald-100 text-emerald-800 border-none"
                                }
                              >
                                {isActiva ? "Activa" : "Alta"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ingreso:{" "}
                              {format(new Date(hospitalizacion.internado_at), "dd MMM yyyy, HH:mm", {
                                locale: es,
                              })}
                              {hospitalizacion.alta_at && (
                                <>
                                  {" "}
                                  · Alta:{" "}
                                  {format(new Date(hospitalizacion.alta_at), "dd MMM yyyy, HH:mm", {
                                    locale: es,
                                  })}
                                </>
                              )}
                            </p>
                            {hospitalizacion.medico_tratante_text && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Médico: {hospitalizacion.medico_tratante_text}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/hospitalizaciones/${hospitalizacion.id}`}
                              className={buttonVariants({ variant: "default", size: "sm" })}
                            >
                              Ver detalle
                            </Link>
                            <Link
                              href="/hospitalizaciones"
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              Ver módulo
                            </Link>
                          </div>
                        </div>

                        {hospitalizacion.motivo_text && (
                          <p className="text-sm whitespace-pre-wrap">{hospitalizacion.motivo_text}</p>
                        )}

                        {ultimoControl ? (
                          <div className="rounded-md bg-muted/30 p-3 text-xs">
                            <p className="font-medium text-foreground">
                              Último control:{" "}
                              {format(new Date(ultimoControl.registrado_at), "dd/MM/yyyy HH:mm")}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {[
                                ultimoControl.temperatura_num ? `${ultimoControl.temperatura_num} C` : null,
                                ultimoControl.frecuencia_cardiaca_num ? `${ultimoControl.frecuencia_cardiaca_num} lpm` : null,
                                ultimoControl.frecuencia_respiratoria_num ? `${ultimoControl.frecuencia_respiratoria_num} rpm` : null,
                                ultimoControl.peso_num ? `${ultimoControl.peso_num} kg` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Sin signos vitales numéricos"}
                            </p>
                            {ultimoControl.observaciones_text && (
                              <p className="mt-1 whitespace-pre-wrap">{ultimoControl.observaciones_text}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin controles registrados.</p>
                        )}
                      </div>
                    );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <BedDouble className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm font-medium">Paciente sin hospitalizaciones registradas</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Los internamientos aparecerán aquí cuando se creen desde el módulo Hospitalizaciones.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Atenciones */}
        <TabsContent value="ordenes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de atenciones</CardTitle>
            </CardHeader>
            <CardContent>
              {ordenes && ordenes.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {ordenes.map((orden) => {
                    const st = ORDEN_ESTADO[orden.estado_text] ?? ORDEN_ESTADO.closed;
                    return (
                      <div key={orden.id} className="flex flex-col gap-3 p-3 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">ORD-{orden.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {orden.started_at
                              ? format(new Date(orden.started_at), "dd/MM/yyyy HH:mm")
                              : format(new Date(orden.created_at), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                          <Link
                            href={`/orden_y_colas/${orden.id}?returnTo=${ordenReturnTo}`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            Ver
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin atenciones registradas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Citas */}
        <TabsContent value="citas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de citas</CardTitle>
            </CardHeader>
            <CardContent>
              {citas && citas.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {citas.map((cita) => {
                    const est = CITA_ESTADO_META[cita.estado] ?? CITA_ESTADO_META.programada;
                    return (
                      <div key={cita.id} className="flex items-start justify-between gap-3 p-3 hover:bg-muted/40 text-sm">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: (cita.tipo_citas as any)?.color ?? "#94a3b8" }} />
                          <div className="min-w-0">
                            <p className="font-medium">{(cita.tipo_citas as any)?.nombre ?? "Sin tipo"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(cita.start_date), "dd MMM yyyy, HH:mm", { locale: es })}
                            </p>
                            {cita.notas_text?.trim() && (
                              <div className="mt-1 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900 ring-1 ring-amber-200">
                                <NotebookPen className="mt-0.5 h-3 w-3 shrink-0 text-amber-700" />
                                <p className="whitespace-pre-wrap break-words">{cita.notas_text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {cita.estado === "en_atencion" && activeOrden ? (
                          <Link
                            href={`/orden_y_colas/${activeOrden.id}?returnTo=${ordenReturnTo}`}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium hover:underline ${est.className}`}
                          >
                            {est.label}
                          </Link>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.className}`}>
                            {est.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin citas registradas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── SECCIONES 360 FUTURAS ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Módulos próximos</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Scissors, label: "Grooming", desc: "Historial de baños, cortes y observaciones de manejo." },
            { icon: FlaskConical, label: "Laboratorios", desc: "Resultados de exámenes y análisis clínicos." },
            { icon: Syringe, label: "Procedimientos", desc: "Cirugías, vacunas y procedimientos clínicos." },
            { icon: FolderOpen, label: "Archivos adjuntos", desc: "Radiografías, ecografías y documentos." },
            { icon: Activity, label: "Actividad", desc: "Registro de cambios y auditoría del expediente." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-lg border border-dashed p-4 flex items-start gap-3 opacity-60">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                <p className="text-xs text-muted-foreground/70 mt-1 italic">Próxima fase</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
