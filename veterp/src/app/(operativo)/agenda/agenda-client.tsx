"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar, Clock, User, PawPrint } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CitaForm } from "./cita-form";
import { TipoCitaForm } from "./tipo-cita-form";
import { AgendaCalendarView } from "./agenda-calendar-view";
import { IniciarAtencionCitaBtn } from "./iniciar-atencion-cita-btn";
import { CitaEstadoControl } from "./cita-estado-control";
import { EditarCitaBtn } from "./editar-cita-btn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Calendar as CalendarIcon } from "lucide-react";
import {
  AREA_META,
  AREA_ORDER,
  getCitaAreaLabel,
  normalizeCitaArea,
  type CitaAgenda,
  type CitaArea,
  type TipoCitaAgenda,
} from "./types";

type AreaFilter = "todas" | CitaArea;

interface AgendaClientProps {
  citas: CitaAgenda[];
  clientes: { id: string; nombre: string }[];
  tiposCita: TipoCitaAgenda[];
}

export function AgendaClient({ citas, clientes, tiposCita }: AgendaClientProps) {
  const [citaDialogOpen, setCitaDialogOpen] = useState(false);
  const [tipoCitaDialogOpen, setTipoCitaDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("todas");

  const filteredCitas = areaFilter === "todas"
    ? citas
    : citas.filter((cita) => normalizeCitaArea(cita.tipo_citas?.area) === areaFilter);

  // Group citas by day
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gestiona las citas y horarios de la clínica.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list"><List className="w-4 h-4 mr-2" /> Lista</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4 mr-2" /> Calendario</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
          <Dialog open={tipoCitaDialogOpen} onOpenChange={setTipoCitaDialogOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <Plus className="mr-2 h-4 w-4" />
              Tipo de Cita
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Tipo de Cita</DialogTitle>
              </DialogHeader>
              <TipoCitaForm onSuccess={() => setTipoCitaDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={citaDialogOpen} onOpenChange={setCitaDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Calendar className="mr-2 h-4 w-4" />
              Nueva Cita
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Programar Cita</DialogTitle>
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
      </div>

      <Tabs value={areaFilter} onValueChange={(v) => setAreaFilter(v as AreaFilter)}>
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
        <AgendaCalendarView citas={filteredCitas} clientes={clientes} tiposCita={tiposCita} />
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
                  <h2 className="text-xl font-semibold capitalize flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {format(parsedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </h2>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {dateCitas.map((cita) => (
                      <Card key={cita.id} className="overflow-hidden">
                        <div
                          className="h-2 w-full"
                          style={{ backgroundColor: cita.tipo_citas?.color || "#ccc" }}
                        />
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-lg flex justify-between items-center">
                            <span className="min-w-0 truncate">{cita.tipo_citas?.nombre || "Cita"}</span>
                            <span className="text-sm font-normal text-muted-foreground flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {format(parseISO(cita.start_date), "HH:mm")}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm space-y-2">
                          <Badge variant="secondary" className="w-fit">
                            {getCitaAreaLabel(cita.tipo_citas?.area)}
                          </Badge>
                          <div className="flex items-center text-muted-foreground">
                            <User className="mr-2 h-4 w-4" />
                            {cita.clientes?.nombre || "Responsable desconocido"}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <PawPrint className="mr-2 h-4 w-4" />
                            {cita.mascotas?.nombre ? (
                              <Link href={`/mascotas/${cita.mascota_id}`} className="hover:text-primary hover:underline transition-colors">
                                {cita.mascotas.nombre}
                              </Link>
                            ) : (
                              "Paciente desconocido"
                            )}
                          </div>
                          <div className="pt-2 flex flex-col gap-2">
                            <CitaEstadoControl citaId={cita.id} estado={cita.estado} startDate={cita.start_date} compact />
                            <EditarCitaBtn cita={cita} clientes={clientes} tiposCita={tiposCita} compact />
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
    </div>
  );
}
