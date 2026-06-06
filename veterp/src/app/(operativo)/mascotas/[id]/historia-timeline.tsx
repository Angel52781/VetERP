"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Stethoscope,
  BedDouble,
  FileText,
  Syringe,
  Scissors,
  Activity,
  Calendar,
  Clock,
  NotebookPen,
} from "lucide-react";
import { getCitaAreaLabel, normalizeCitaArea } from "@/app/(operativo)/agenda/types";
import { getSeguimientoTipoLabel } from "@/lib/validators/recordatorios";

import { RegistroPrevioDialog } from "./registro-previo-dialog";

type EventType = "atencion" | "hospitalizacion" | "seguimiento" | "adjunto" | "estetica" | "registro_previo";

interface TimelineEvent {
  id: string;
  type: EventType;
  date: Date;
  title: string;
  subtitle?: string | null;
  icon: React.ElementType;
  iconColorClass: string;
  borderClass: string;
  renderDetails?: () => React.ReactNode;
  renderPreview?: () => React.ReactNode;
  url?: string;
  urlLabel?: string;
}

const FILTER_OPTIONS = [
  { id: "todo", label: "Todo" },
  { id: "clinico", label: "Clínico" },
  { id: "atenciones", label: "Atenciones" },
  { id: "hospitalizaciones", label: "Hospitalizaciones" },
  { id: "seguimientos", label: "Seguimientos" },
  { id: "adjuntos", label: "Adjuntos" },
  { id: "estetica", label: "Estética" },
  { id: "antecedentes", label: "Antecedentes" },
] as const;

type FilterId = (typeof FILTER_OPTIONS)[number]["id"];

interface HistoriaTimelineProps {
  mascotaId: string;
  ordenes: any[];
  hospitalizaciones: any[];
  citas: any[];
  seguimientos: any[];
  adjuntos: any[];
  registros_previos: any[];
}

export function HistoriaTimeline({
  mascotaId,
  ordenes,
  hospitalizaciones,
  citas,
  seguimientos,
  adjuntos,
  registros_previos,
}: HistoriaTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("todo");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEvent = (id: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const events = useMemo(() => {
    const arr: TimelineEvent[] = [];

    // 1. Atenciones clínicas
    for (const orden of ordenes || []) {
      const date = orden.started_at ? new Date(orden.started_at) : new Date(orden.created_at);
      const mainNote = (orden.entradas_clinicas || []).find(
        (e: any) => e.tipo_text === "Nota Clínica de Evolución" || e.tipo_text === "Signos Vitales y Triaje",
      );
      const title = mainNote?.motivo_consulta_text
        ? `Consulta: ${mainNote.motivo_consulta_text}`
        : "Atención registrada";

      arr.push({
        id: `orden-${orden.id}`,
        type: "atencion",
        date,
        title,
        subtitle: orden.staff_member
          ? `Atendido por: ${orden.staff_member.nombreVisible || "Personal autorizado"}`
          : "Personal autorizado",
        icon: Stethoscope,
        iconColorClass: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
        borderClass: "border-l-blue-500",
        url: `/orden_y_colas/${orden.id}?returnTo=${encodeURIComponent(`/mascotas/${mascotaId}`)}`,
        urlLabel: "Ver atención",
        renderDetails: () => {
          const entradas = [...(orden.entradas_clinicas || [])].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
          if (entradas.length === 0) return <p className="text-sm text-muted-foreground">Sin detalle registrado.</p>;
          return (
            <div className="space-y-4">
              {entradas.map((e: any) => {
                const isMain = e.tipo_text === "Nota Clínica de Evolución" || e.tipo_text === "Signos Vitales y Triaje";
                const vitales = [
                  e.peso_kg_num ? `${e.peso_kg_num} kg` : null,
                  e.temperatura_c_num ? `${e.temperatura_c_num} °C` : null,
                  e.frecuencia_cardiaca_num ? `${e.frecuencia_cardiaca_num} lpm` : null,
                  e.frecuencia_respiratoria_num ? `${e.frecuencia_respiratoria_num} rpm` : null,
                ].filter(Boolean);

                const normalizeLegacyText = (str: string | null | undefined) => {
                  if (!str) return str;
                  let cleaned = str.trim();
                  if (cleaned === "Registro médico estructurado (SOAP)" || cleaned === "Registro médico estructurado") return "Registro de atención";
                  cleaned = cleaned.replace(/,\s*$/, '');
                  return cleaned;
                };

                return (
                  <div key={e.id} className="rounded-md bg-muted/40 p-3 text-sm">
                    <p className="mb-2 font-medium">
                      {isMain ? "Registro de atención" : "Nota adicional de la visita"}
                      <span className="ml-2 font-normal text-muted-foreground text-xs">
                        {format(new Date(e.created_at), "HH:mm")}
                      </span>
                    </p>
                    {vitales.length > 0 && (
                      <p className="mb-2 text-xs text-muted-foreground">{vitales.join(" · ")}</p>
                    )}
                    {e.diagnostico_text && (
                      <div className="mb-2">
                        <span className="font-semibold text-xs text-muted-foreground uppercase">Diagnóstico: </span>
                        <span>{normalizeLegacyText(e.diagnostico_text)}</span>
                      </div>
                    )}
                    {e.plan_tratamiento_text && (
                      <div className="mb-2">
                        <span className="font-semibold text-xs text-muted-foreground uppercase">Plan terapéutico: </span>
                        <span>{normalizeLegacyText(e.plan_tratamiento_text)}</span>
                      </div>
                    )}
                    {e.texto_text && <p className="whitespace-pre-wrap mt-1">{normalizeLegacyText(e.texto_text)}</p>}
                    {e.observaciones_text && <p className="whitespace-pre-wrap mt-1">{normalizeLegacyText(e.observaciones_text)}</p>}
                  </div>
                );
              })}
            </div>
          );
        },
      });
    }

    // 2. Hospitalizaciones
    for (const hosp of hospitalizaciones || []) {
      const isActiva = hosp.estado_text === "activa";
      arr.push({
        id: `hosp-${hosp.id}`,
        type: "hospitalizacion",
        date: new Date(hosp.internado_at),
        title: hosp.diagnostico_presuntivo_text || "Internamiento",
        subtitle: hosp.medico_tratante_text ? `Médico: ${hosp.medico_tratante_text}` : "Personal autorizado",
        icon: BedDouble,
        iconColorClass: isActiva ? "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" : "text-slate-600 bg-slate-100 dark:bg-slate-900/30",
        borderClass: isActiva ? "border-l-indigo-500 ring-1 ring-indigo-500/20" : "border-l-slate-400",
        url: `/hospitalizaciones/${hosp.id}`,
        urlLabel: "Ver internamiento",
        renderDetails: () => (
          <div className="text-sm">
            <p className="mb-2">
              <span className="font-medium">Ingreso:</span> {format(new Date(hosp.internado_at), "dd/MM/yyyy HH:mm")}
              {hosp.alta_at && (
                <>
                  <br />
                  <span className="font-medium">Alta:</span> {format(new Date(hosp.alta_at), "dd/MM/yyyy HH:mm")}
                </>
              )}
            </p>
            {isActiva && (
              <Badge className="bg-indigo-100 text-indigo-800 border-none mb-2">Hospitalización activa</Badge>
            )}
            {hosp.motivo_text && <p className="whitespace-pre-wrap text-muted-foreground">{hosp.motivo_text}</p>}
          </div>
        ),
      });
    }

    // 3. Grooming/Estética
    for (const cita of citas || []) {
      const area = normalizeCitaArea(cita.tipo_citas?.area);
      if (area === "grooming" || area === "banos") {
        const grooming = cita.grooming_servicios?.[0];
        arr.push({
          id: `grooming-${cita.id}`,
          type: "estetica",
          date: new Date(cita.start_date),
          title: cita.tipo_citas?.nombre ?? "Servicio de grooming",
          subtitle: cita.estado === "completada" || grooming?.estado_text === "completado" ? "Completado" : "Programado",
          icon: Scissors,
          iconColorClass: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
          borderClass: "border-l-amber-200 border-opacity-50",
          renderDetails: () => {
            const notes = [
              grooming?.servicios_realizados_text,
              grooming?.observaciones_text,
              cita.notas_text,
            ].filter((v) => typeof v === "string" && v.trim().length > 0);
            if (notes.length === 0) return <p className="text-sm text-muted-foreground">Sin detalle registrado.</p>;
            return (
              <div className="space-y-2 text-sm">
                {notes.map((note, i) => (
                  <p key={i} className="whitespace-pre-wrap text-muted-foreground">{note}</p>
                ))}
              </div>
            );
          },
        });
      }
    }

    // 4. Seguimientos
    for (const seg of seguimientos || []) {
      // Use creation date, application date, or resolved date for timeline ordering
      const dateStr = seg.resuelto_at || seg.fecha_aplicacion_date || seg.created_at;
      if (!dateStr) continue;
      arr.push({
        id: `seg-${seg.id}`,
        type: "seguimiento",
        date: new Date(dateStr),
        title: getSeguimientoTipoLabel(seg.nombre_text || seg.tipo_text),
        subtitle: seg.estado_text === "resuelto" ? "Resuelto" : "Pendiente",
        icon: Syringe,
        iconColorClass: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
        borderClass: "border-l-emerald-500",
        renderDetails: () => {
          const displayTipo = getSeguimientoTipoLabel(seg.tipo_text);
          return (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Tipo: {displayTipo}</p>
              {seg.notas_text && <p className="whitespace-pre-wrap">Notas: {seg.notas_text}</p>}
              {seg.resolucion_notas_text && <p className="whitespace-pre-wrap">Resolución: {seg.resolucion_notas_text}</p>}
            </div>
          );
        },
      });
    }

    // 5. Adjuntos
    for (const adj of adjuntos || []) {
      arr.push({
        id: `adj-${adj.id}`,
        type: "adjunto",
        date: new Date(adj.created_at),
        title: adj.nombre_archivo_text,
        subtitle: adj.tipo_text,
        icon: FileText,
        iconColorClass: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
        borderClass: "border-l-purple-400",
        url: adj.signed_url ?? undefined,
        urlLabel: "Ver archivo",
        renderDetails: () => (
          <div className="text-sm text-muted-foreground space-y-2">
            {adj.notas_text && <p className="whitespace-pre-wrap">{adj.notas_text}</p>}
            {adj.subido_por && <p>Subido por: Personal autorizado</p>}
          </div>
        ),
      });
    }

    // 6. Registros previos
    for (const rp of registros_previos || []) {
      const isAnulado = rp.anulado_at != null;
      arr.push({
        id: `rp-${rp.id}`,
        type: "registro_previo",
        date: new Date(rp.fecha_historica_date),
        title: rp.titulo_text,
        subtitle: isAnulado ? "Anulado" : "Registro previo",
        icon: FileText,
        iconColorClass: isAnulado
          ? "text-muted-foreground bg-muted/50 dark:bg-muted/10 opacity-70"
          : "text-teal-600 bg-teal-100 dark:bg-teal-900/30",
        borderClass: isAnulado ? "border-l-muted opacity-70" : "border-l-teal-500",
        renderPreview: () => (
          <div className="mt-2 space-y-1">
            {rp.fecha_aproximada_bool && (
              <Badge variant="secondary" className="mr-2 text-[10px] h-5">Fecha aproximada</Badge>
            )}
            {rp.fuente_text && (
              <Badge variant="outline" className="text-[10px] h-5 font-normal text-muted-foreground border-dashed">
                Fuente: {rp.fuente_text}
              </Badge>
            )}
            <p className={`text-xs text-muted-foreground line-clamp-2 mt-1.5 ${isAnulado ? "line-through opacity-70" : ""}`}>
              {rp.descripcion_text}
            </p>
          </div>
        ),
        renderDetails: () => (
          <div className={`text-sm space-y-2 ${isAnulado ? "text-muted-foreground opacity-80" : "text-muted-foreground"}`}>
            <p className={`whitespace-pre-wrap ${isAnulado ? "line-through" : ""}`}>{rp.descripcion_text}</p>
            {isAnulado && rp.motivo_anulacion_text && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 rounded text-xs border border-red-100 dark:border-red-900/30">
                <span className="font-semibold uppercase tracking-wider block mb-1">Motivo de anulación:</span>
                {rp.motivo_anulacion_text}
              </div>
            )}
          </div>
        ),
      });
    }

    return arr.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [ordenes, hospitalizaciones, citas, seguimientos, adjuntos, registros_previos, mascotaId]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "todo") return events;
    if (activeFilter === "clinico") return events.filter((e) => e.type !== "estetica");
    
    // Map plural filters to singular event types
    const filterToTypeMap: Record<string, EventType> = {
      atenciones: "atencion",
      hospitalizaciones: "hospitalizacion",
      seguimientos: "seguimiento",
      adjuntos: "adjunto",
      estetica: "estetica",
      antecedentes: "registro_previo",
    };

    const targetType = filterToTypeMap[activeFilter];
    return events.filter((e) => e.type === targetType);
  }, [events, activeFilter]);

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <RegistroPrevioDialog mascotaId={mascotaId} />
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-card">
          <Activity className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm">Sin historial registrado para este paciente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((opt) => {
          // Count events for this filter
          const count = opt.id === "todo"
            ? events.length
            : events.filter((e) => {
                if (opt.id === "clinico") return e.type !== "estetica";
                const targetType = {
                  atenciones: "atencion",
                  hospitalizaciones: "hospitalizacion",
                  seguimientos: "seguimiento",
                  adjuntos: "adjunto",
                  estetica: "estetica",
                  antecedentes: "registro_previo",
                }[opt.id] as EventType;
                return e.type === targetType;
              }).length;

          return (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              disabled={count === 0}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                activeFilter === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              <span>{opt.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeFilter === opt.id ? "bg-primary-foreground/20" : "bg-background/50"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
        </div>
        <RegistroPrevioDialog mascotaId={mascotaId} />
      </div>

      {/* Timeline */}
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[8.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-12 md:pl-[10rem]">No hay eventos para este filtro.</p>
        ) : (
          filteredEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            const isEstetica = event.type === "estetica";

            return (
              <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${event.iconColorClass}`}
                >
                  <event.icon className="w-5 h-5" />
                </div>
                
                {/* Date (Desktop) */}
                <div className="hidden md:block w-[calc(50%-2.5rem)] text-right md:group-even:text-left text-muted-foreground">
                  <div className="md:group-even:pl-4 md:group-odd:pr-4">
                    <p className="text-sm font-semibold">{format(event.date, "dd MMM yyyy", { locale: es })}</p>
                    <p className="text-xs">{format(event.date, "HH:mm", { locale: es })}</p>
                  </div>
                </div>

                {/* Card */}
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)]">
                  <Card className={`overflow-hidden border-l-4 ${event.borderClass} ${isEstetica ? "bg-muted/10 opacity-90" : "bg-card shadow-sm"}`}>
                    <div 
                      className={`p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors ${isExpanded ? "bg-muted/20" : ""}`}
                      onClick={() => toggleEvent(event.id)}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                          {event.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{event.subtitle}</p>}
                        </div>
                        <div className="md:hidden mt-1 sm:mt-0 text-left sm:text-right">
                          <p className="text-xs font-medium text-muted-foreground">{format(event.date, "dd MMM yyyy, HH:mm", { locale: es })}</p>
                        </div>
                      </div>
                      {event.renderPreview && event.renderPreview()}
                    </div>
                    {isExpanded && event.renderDetails && (
                      <div className="px-3 pb-3 sm:px-4 sm:pb-4 border-t pt-3 bg-card">
                        {event.renderDetails()}
                        {event.url && (
                          <div className="mt-4 flex justify-end">
                            <Link 
                              href={event.url} 
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                              target={event.type === "adjunto" ? "_blank" : undefined}
                            >
                              {event.urlLabel || "Ver detalle"}
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
