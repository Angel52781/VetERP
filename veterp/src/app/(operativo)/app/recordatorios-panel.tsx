"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, Stethoscope } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FiltroRecordatorios = "vencidos" | "7d" | "30d";

export type DashboardRecordatorio = {
  id: string;
  tipo_text: string | null;
  nombre_text: string | null;
  proxima_fecha_date: string | null;
  mascotas: {
    id: string | null;
    nombre: string | null;
    clientes: {
      id: string | null;
      nombre: string | null;
    } | null;
  } | null;
};

type RecordatoriosPanelProps = {
  todayDate: string;
  day7Date: string;
  counts: {
    vencidos: number;
    proximos7: number;
    proximos30: number;
  };
  vencidos: DashboardRecordatorio[];
  proximos7: DashboardRecordatorio[];
  proximos30: DashboardRecordatorio[];
};

const filtros: Array<{
  key: FiltroRecordatorios;
  title: string;
  getCount: (counts: RecordatoriosPanelProps["counts"]) => number;
  activeClass: string;
  countClass: string;
}> = [
  {
    key: "vencidos",
    title: "Vencidos",
    getCount: (counts) => counts.vencidos,
    activeClass: "border-red-300 bg-red-50 shadow-sm",
    countClass: "text-red-700",
  },
  {
    key: "7d",
    title: "Próximos 7 días",
    getCount: (counts) => counts.proximos7,
    activeClass: "border-orange-300 bg-orange-50 shadow-sm",
    countClass: "text-orange-700",
  },
  {
    key: "30d",
    title: "Próximos 30 días",
    getCount: (counts) => counts.proximos30,
    activeClass: "border-blue-300 bg-blue-50 shadow-sm",
    countClass: "text-blue-700",
  },
];

const tipoLabels: Record<string, string> = {
  vacuna: "Vacuna",
  control: "Control",
  llamar_responsable: "Llamar responsable",
  aplicar_dosis: "Aplicar dosis",
  muestra_pendiente: "Muestra pendiente",
  revision: "Revisión",
  post_consulta: "Post consulta",
  administrativo: "Administrativo",
  laboratorio: "Laboratorio",
};

function getFiltroItems(
  filtro: FiltroRecordatorios,
  items: Pick<RecordatoriosPanelProps, "vencidos" | "proximos7" | "proximos30">,
) {
  if (filtro === "vencidos") return items.vencidos;
  if (filtro === "30d") return items.proximos30;
  return items.proximos7;
}

function getEstadoVisual(proximaFecha: string, todayDate: string, day7Date: string) {
  if (proximaFecha < todayDate) {
    return { label: "Vencido", cls: "bg-red-100 text-red-800" };
  }

  if (proximaFecha <= day7Date) {
    return { label: "Próximo (7d)", cls: "bg-orange-100 text-orange-800" };
  }

  return { label: "Próximo (30d)", cls: "bg-blue-100 text-blue-800" };
}

function getEmptyMessage(filtro: FiltroRecordatorios) {
  if (filtro === "vencidos") return "No hay recordatorios vencidos.";
  if (filtro === "30d") return "No hay recordatorios entre 8 y 30 días.";
  return "No hay recordatorios en los próximos 7 días.";
}

export function RecordatoriosPanel({
  todayDate,
  day7Date,
  counts,
  vencidos,
  proximos7,
  proximos30,
}: RecordatoriosPanelProps) {
  const [filtroActivo, setFiltroActivo] = useState<FiltroRecordatorios>(() => {
    if (counts.vencidos > 0) return "vencidos";
    if (counts.proximos7 > 0) return "7d";
    if (counts.proximos30 > 0) return "30d";
    return "7d";
  });
  const recordatorios = getFiltroItems(filtroActivo, { vencidos, proximos7, proximos30 });

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Recordatorios</CardTitle>
          <CardDescription>
            Seguimientos con vencimiento operativo: vencidos, próximos 7 días y próximos 30 días.
          </CardDescription>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {filtros.map((filtro) => {
            const count = filtro.getCount(counts);
            const active = filtroActivo === filtro.key;

            return (
              <button
                key={filtro.key}
                type="button"
                onClick={() => setFiltroActivo(filtro.key)}
                className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 ${
                  active ? filtro.activeClass : "bg-muted/10"
                }`}
              >
                <p className={`text-xs font-medium ${active || count > 0 ? filtro.countClass : "text-muted-foreground"}`}>
                  {filtro.title}
                </p>
                <p className={`text-2xl font-bold ${active || count > 0 ? filtro.countClass : "text-foreground"}`}>
                  {count}
                </p>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Link
            href={`/recordatorios?filtro=${filtroActivo}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Ver lista completa
          </Link>
        </div>

        {recordatorios.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            {getEmptyMessage(filtroActivo)}
          </div>
        ) : (
          <div className="divide-y rounded-md border">
            {recordatorios.map((seguimiento) => {
              const proximaFecha = seguimiento.proxima_fecha_date;
              const estado = proximaFecha
                ? getEstadoVisual(proximaFecha, todayDate, day7Date)
                : { label: "Sin fecha", cls: "bg-secondary text-secondary-foreground" };
              const mascota = seguimiento.mascotas;
              const cliente = mascota?.clientes;
              const tipo = seguimiento.tipo_text ? tipoLabels[seguimiento.tipo_text] ?? seguimiento.tipo_text : "Recordatorio";

              return (
                <div
                  key={seguimiento.id}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      seguimiento.tipo_text === "vacuna"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {seguimiento.tipo_text === "vacuna" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <Stethoscope className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{mascota?.nombre ?? "Paciente sin nombre"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cliente?.nombre ?? "Responsable no disponible"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium uppercase">{tipo}</span> · {seguimiento.nombre_text ?? "Sin detalle"}
                    </p>
                    {proximaFecha ? (
                      <p className="text-xs text-muted-foreground">
                        Próxima fecha: {format(new Date(`${proximaFecha}T00:00:00`), "dd/MM/yyyy", { locale: es })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${estado.cls}`}>{estado.label}</span>
                    {mascota?.id ? (
                      <Link
                        href={`/mascotas/${mascota.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver paciente
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
