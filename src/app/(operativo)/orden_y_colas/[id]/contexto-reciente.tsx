"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, BedDouble, Syringe, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSeguimientoTipoLabel } from "@/lib/validators/recordatorios";

interface ContextoRecienteProps {
  currentOrdenId: string;
  mascotaId: string;
  ordenes: any[];
  hospitalizaciones: any[];
  seguimientos: any[];
  mascotaReturnTo: string;
}

type RecentEvent = {
  id: string;
  type: "atencion" | "hospitalizacion" | "seguimiento";
  date: Date;
  title: string;
  icon: React.ElementType;
  iconColorClass: string;
  summary: string;
};

export function ContextoReciente({
  currentOrdenId,
  mascotaId,
  ordenes,
  hospitalizaciones,
  seguimientos,
  mascotaReturnTo,
}: ContextoRecienteProps) {
  const recentEvents = useMemo(() => {
    const arr: RecentEvent[] = [];

    // 1. Atenciones clínicas (excluyendo la actual)
    for (const orden of ordenes || []) {
      if (orden.id === currentOrdenId) continue;
      
      const date = orden.started_at ? new Date(orden.started_at) : new Date(orden.created_at);
      const mainNote = (orden.entradas_clinicas || []).find(
        (e: any) => e.tipo_text === "Nota Clínica de Evolución" || e.tipo_text === "Signos Vitales y Triaje"
      );
      
      let summary = "Sin detalle clínico registrado.";
      if (mainNote?.diagnostico_text) {
        summary = mainNote.diagnostico_text.replace(/,\s*$/, '');
      } else if (mainNote?.motivo_consulta_text) {
        summary = mainNote.motivo_consulta_text;
      }

      // Evitar término legacy SOAP
      const summaryTrimmed = summary.trim();
      if (summaryTrimmed === "Registro médico estructurado (SOAP)" || summaryTrimmed === "Registro médico estructurado") {
        summary = "Registro de atención";
      }

      arr.push({
        id: `orden-${orden.id}`,
        type: "atencion",
        date,
        title: "Atención médica",
        icon: Stethoscope,
        iconColorClass: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
        summary,
      });
    }

    // 2. Hospitalizaciones
    for (const hosp of hospitalizaciones || []) {
      const isActiva = hosp.estado_text === "activa";
      arr.push({
        id: `hosp-${hosp.id}`,
        type: "hospitalizacion",
        date: new Date(hosp.internado_at),
        title: isActiva ? "Hospitalización activa" : "Hospitalización previa",
        icon: BedDouble,
        iconColorClass: isActiva ? "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" : "text-slate-600 bg-slate-100 dark:bg-slate-900/30",
        summary: hosp.diagnostico_presuntivo_text || hosp.motivo_text || "Internamiento registrado.",
      });
    }

    // 3. Seguimientos
    for (const seg of seguimientos || []) {
      const dateStr = seg.resuelto_at || seg.fecha_aplicacion_date || seg.created_at;
      if (!dateStr) continue;
      const rawNombre = seg.nombre_text || seg.tipo_text;
      arr.push({
        id: `seg-${seg.id}`,
        type: "seguimiento",
        date: new Date(dateStr),
        title: `Seguimiento: ${seg.estado_text === "resuelto" ? "Resuelto" : "Pendiente"}`,
        icon: Syringe,
        iconColorClass: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
        summary: getSeguimientoTipoLabel(rawNombre),
      });
    }

    return arr.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3);
  }, [ordenes, hospitalizaciones, seguimientos, currentOrdenId]);

  if (recentEvents.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Clock className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-sm font-medium">Sin antecedentes recientes registrados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-l-4 border-l-primary/60">
      <CardHeader className="pb-3 bg-muted/20 border-b">
        <CardTitle className="text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-col">
            <span>Contexto reciente del paciente</span>
            <span className="text-xs font-normal text-muted-foreground mt-0.5">Historial previo del paciente. Solo lectura.</span>
          </div>
          <Link 
            href={`/mascotas/${mascotaId}?returnTo=${mascotaReturnTo}`}
            className="text-xs font-normal text-primary hover:underline flex items-center gap-1"
          >
            Ver historia completa <ArrowRight className="w-3 h-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-4 pb-4">
        <div className="space-y-4">
          {recentEvents.map((ev) => (
            <div key={ev.id} className="flex gap-3">
              <div className={`mt-0.5 flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${ev.iconColorClass}`}>
                <ev.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium leading-none">{ev.title}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(ev.date, "dd MMM", { locale: es })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {ev.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
