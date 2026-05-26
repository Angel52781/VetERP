"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Calendar as CalendarIcon, Clock, NotebookPen, PawPrint, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CitaForm } from "./cita-form";
import { AgendaCalendarView } from "./agenda-calendar-view";
import { IniciarAtencionCitaBtn } from "./iniciar-atencion-cita-btn";
import { CitaEstadoControl } from "./cita-estado-control";
import { EditarCitaBtn } from "./editar-cita-btn";
import { TiposCitaManager } from "./tipos-cita-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List } from "lucide-react";
import {
  AREA_META,
  AREA_ORDER,
  getCitaAreaLabel,
  normalizeCitaArea,
  type CitaAgenda,
  type CitaArea,
  type TipoCitaAgenda,
} from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AreaFilter = "todas" | CitaArea;

interface AgendaClientProps {
  citas: CitaAgenda[];
  clientes: { id: string; nombre: string }[];
  tiposCita: TipoCitaAgenda[];
  tiposCitaGestion: TipoCitaAgenda[];
}

export function AgendaClient({ citas, clientes, tiposCita, tiposCitaGestion }: AgendaClientProps) {
  const [citaDialogOpen, setCitaDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("todas");

  const filteredCitas = areaFilter === "todas"
    ? citas
    : citas.filter((cita) => normalizeCitaArea(cita.tipo_citas?.area) === areaFilter);

  const groupedCitas = filteredCitas.reduce((acc, cita) => {
    const dateStr = cita.start_date.split("T")[0];
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(cita);
    return acc;
  }, {} as Record<string, CitaAgenda[]>);

  const sortedDates = Object.keys(groupedCitas).sort();
  const areaCounts = citas.reduce((acc, cita) => {
    const area = normalizeCitaArea(cita.tipo_citas?.area);
    acc[area] = (acc[area] ?? 0) + 1;
    return acc;
  }, {} as Record<CitaArea, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">Gestiona las citas, horarios y tipos de cita de la clínica.</p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "calendar")}>
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="list"><List className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4" /> Calendario</TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={citaDialogOpen} onOpenChange={setCitaDialogOpen}>
            <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
              <Calendar className="mr-2 h-4 w-4" />
              Nueva Cita
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Programar cita</DialogTitle>
              </DialogHeader>
              <CitaForm
                clientes={clientes}
                tiposCita={tiposCita}
                onSuccess={() => setCitaDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de cita</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-6">
          <Tabs value={areaFilter} onValueChange={(value) => setAreaFilter(value as AreaFilter)}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="todas">Todas ({citas.length})</TabsTrigger>
              {AREA_ORDER.filter((area) => area !== "otro").map((area) => (
                <TabsTrigger key={area} value={area}>
                  {AREA_META[area].label} ({areaCounts[area] ?? 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {viewMode === "calendar" ? (
            <AgendaCalendarView citas={filteredCitas} clientes={clientes} tiposCita={tiposCitaGestion} />
          ) : (
            <div className="space-y-8">
              {sortedDates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay citas programadas para el filtro seleccionado.
                </div>
              ) : (
                sortedDates.map((dateStr) => {
                  const dateCitas = groupedCitas[dateStr];
                  const parsedDate = parseISO(dateStr);

                  return (
                    <div key={dateStr} className="space-y-4">
                      <h2 className="flex items-center gap-2 text-xl font-semibold capitalize">
                        <Calendar className="h-5 w-5 text-primary" />
                        {format(parsedDate, "EEEE, d 'de' MMMM", { locale: es })}
                      </h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {dateCitas.map((cita) => (
                          <Card key={cita.id} className="overflow-hidden">
                            <div className="h-2 w-full" style={{ backgroundColor: cita.tipo_citas?.color || "#ccc" }} />
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
                                <span className="min-w-0 truncate">{cita.tipo_citas?.nombre || "Cita"}</span>
                                <span className="text-sm font-normal text-muted-foreground flex items-center">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {format(parseISO(cita.start_date), "HH:mm")}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-sm space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="w-fit">
                                  {getCitaAreaLabel(cita.tipo_citas?.area)}
                                </Badge>
                                {cita.tipo_citas?.is_disabled && (
                                  <Badge variant="outline" className="w-fit">Tipo inactivo</Badge>
                                )}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <User className="mr-2 h-4 w-4" />
                                {cita.clientes?.nombre || "Responsable desconocido"}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <PawPrint className="mr-2 h-4 w-4" />
                                {cita.mascotas?.nombre ? (
                                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                                    <Link href={`/mascotas/${cita.mascota_id}`} className="hover:text-primary hover:underline transition-colors">
                                      {cita.mascotas.nombre}
                                    </Link>
                                    {cita.mascotas.codigo_text?.trim() ? (
                                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                        #{cita.mascotas.codigo_text}
                                      </Badge>
                                    ) : null}
                                  </span>
                                ) : (
                                  "Paciente desconocido"
                                )}
                              </div>
                              {cita.notas_text?.trim() ? (
                                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-900">
                                  <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                      Notas de cita
                                    </p>
                                    <p className="whitespace-pre-wrap break-words text-xs">{cita.notas_text}</p>
                                  </div>
                                </div>
                              ) : null}
                              <div className="flex flex-col gap-2 pt-2">
                                <CitaEstadoControl citaId={cita.id} estado={cita.estado} startDate={cita.start_date} compact />
                                <EditarCitaBtn cita={cita} clientes={clientes} tiposCita={tiposCitaGestion} compact />
                                <IniciarAtencionCitaBtn
                                  citaId={cita.id}
                                  clienteId={cita.cliente_id}
                                  mascotaId={cita.mascota_id}
                                  citaEstado={cita.estado}
                                  citaStartDate={cita.start_date}
                                  activeOrderId={cita.active_order_id}
                                  activeOrderEstadoText={cita.active_order_estado_text}
                                  compact
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tipos">
          <TiposCitaManager tiposCita={tiposCitaGestion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
