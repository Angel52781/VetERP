"use client";

import { type CSSProperties, useMemo, useState } from "react";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, PawPrint, User } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IniciarAtencionCitaBtn } from "./iniciar-atencion-cita-btn";
import { CitaEstadoControl } from "./cita-estado-control";
import { EditarCitaBtn } from "./editar-cita-btn";
import { getCitaAreaLabel, type CitaAgenda, type TipoCitaAgenda } from "./types";

interface AgendaCalendarViewProps {
  citas: CitaAgenda[];
  clientes: { id: string; nombre: string }[];
  tiposCita: TipoCitaAgenda[];
}

const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = HOURS_IN_DAY * 60;
const HOURS = Array.from({ length: HOURS_IN_DAY }, (_, hour) => hour);
const ROW_HEIGHT = 60;
const TIME_GUTTER_WIDTH = 76;
const HEADER_HEIGHT = 64;
const MIN_EVENT_HEIGHT = 48;

function minutesFromDate(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function citasOverlap(a: CitaAgenda, b: CitaAgenda) {
  return parseISO(a.start_date) < parseISO(b.end_date) && parseISO(a.end_date) > parseISO(b.start_date);
}

function getCitaTimestamp(cita: CitaAgenda) {
  return parseISO(cita.start_date).getTime();
}

export function AgendaCalendarView({ citas, clientes, tiposCita }: AgendaCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const citasEstaSemana = useMemo(() => {
    return citas.filter((cita) => {
      const start = parseISO(cita.start_date);
      return start >= weekStart && start <= weekEnd;
    });
  }, [citas, weekStart, weekEnd]);

  const citasByDay = useMemo(() => {
    const map = new Map<string, CitaAgenda[]>();

    daysInWeek.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayCitas = citasEstaSemana
        .filter((cita) => isSameDay(parseISO(cita.start_date), day))
        .sort((a, b) => getCitaTimestamp(a) - getCitaTimestamp(b));

      map.set(dateStr, dayCitas);
    });

    return map;
  }, [citasEstaSemana, daysInWeek]);

  const gridTemplateColumns = `${TIME_GUTTER_WIDTH}px repeat(7, minmax(112px, 1fr))`;
  const gridHeight = HOURS_IN_DAY * ROW_HEIGHT;

  const prevWeek = () => setCurrentDate((date) => subWeeks(date, 1));
  const nextWeek = () => setCurrentDate((date) => addWeeks(date, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventStyle = (cita: CitaAgenda, dayCitas: CitaAgenda[]): CSSProperties => {
    const start = parseISO(cita.start_date);
    const end = parseISO(cita.end_date);
    const startMinutes = clamp(minutesFromDate(start), 0, MINUTES_IN_DAY);
    const rawEndMinutes = minutesFromDate(end);
    const endMinutes =
      end > start && (!isSameDay(start, end) || rawEndMinutes <= startMinutes)
        ? MINUTES_IN_DAY
        : clamp(rawEndMinutes, 0, MINUTES_IN_DAY);
    const durationMinutes = Math.max(endMinutes - startMinutes, 15);

    const overlappingCitas = dayCitas
      .filter((candidate) => citasOverlap(candidate, cita))
      .sort((a, b) => getCitaTimestamp(a) - getCitaTimestamp(b));

    const overlapColumns = Math.min(Math.max(overlappingCitas.length, 1), 3);
    const overlapIndex = Math.max(
      overlappingCitas.findIndex((candidate) => candidate.id === cita.id),
      0,
    ) % overlapColumns;

    return {
      top: (startMinutes / 60) * ROW_HEIGHT,
      height: Math.max((durationMinutes / 60) * ROW_HEIGHT, MIN_EVENT_HEIGHT),
      left: overlapColumns === 1 ? 6 : `calc(${(100 / overlapColumns) * overlapIndex}% + 4px)`,
      width: overlapColumns === 1 ? "calc(100% - 12px)" : `calc(${100 / overlapColumns}% - 8px)`,
      zIndex: 10 + overlapIndex,
      backgroundColor: cita.tipo_citas?.color || "#64748b",
      borderColor: cita.tipo_citas?.color || "#475569",
    };
  };

  return (
    <Card className="overflow-hidden border border-border/80 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="min-w-[150px] text-lg font-semibold capitalize tracking-tight text-foreground">
            {format(weekStart, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex items-center rounded-md border bg-background p-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium" onClick={goToToday}>
              Ir a hoy
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs font-medium text-muted-foreground">
          {format(weekStart, "dd MMM", { locale: es })} - {format(weekEnd, "dd MMM", { locale: es })}
        </div>
      </div>

      <div className="overflow-x-auto bg-background">
        <div className="min-w-[920px]">
          <div
            className="grid border-b border-border bg-background shadow-sm"
            style={{ gridTemplateColumns, height: HEADER_HEIGHT }}
          >
            <div className="border-r border-border bg-muted/20" />
            {daysInWeek.map((day) => {
              const currentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`flex flex-col items-center justify-center border-r border-border/70 last:border-r-0 ${
                    currentDay ? "bg-primary/[0.04]" : "bg-background"
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase ${currentDay ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE", { locale: es })}
                  </span>
                  <span
                    className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      currentDay ? "bg-primary text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="max-h-[720px] overflow-y-auto pb-12">
            <div
              className="grid"
              style={{
                gridTemplateColumns,
                height: gridHeight,
              }}
            >
              <div className="border-r border-border bg-muted/10">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="relative border-b border-border/30 pr-3 text-right"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <span className="relative -top-2 rounded bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {daysInWeek.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const currentDay = isToday(day);
                const dayCitas = citasByDay.get(dateStr) || [];

                return (
                  <div
                    key={day.toISOString()}
                    className={`relative border-r border-border/60 last:border-r-0 ${
                      currentDay ? "bg-primary/[0.025]" : "bg-background"
                    }`}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-border/25"
                        style={{ height: ROW_HEIGHT }}
                      />
                    ))}

                    {dayCitas.map((cita) => {
                      const style = getEventStyle(cita, dayCitas);

                      return (
                        <Dialog key={cita.id}>
                          <DialogTrigger
                            render={
                              <button
                                className="absolute rounded-md border border-l-4 px-2 py-1.5 text-left shadow-sm transition hover:brightness-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                style={style}
                              />
                            }
                          >
                          <div className="flex h-full min-h-0 flex-col justify-center overflow-hidden text-white">
                              <span className="truncate text-[11px] font-semibold leading-tight text-white/90">
                                {format(parseISO(cita.start_date), "HH:mm")}
                              </span>
                              <span className="truncate text-xs font-semibold leading-tight">
                              {cita.mascotas?.nombre || "Paciente"}
                              </span>
                              <span className="truncate text-[10px] font-medium leading-tight text-white/85">
                                {getCitaAreaLabel(cita.tipo_citas?.area)}
                              </span>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-xs">
                          <DialogHeader className="border-b pb-3">
                            <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: cita.tipo_citas?.color || "#ccc" }}
                              />
                              {cita.tipo_citas?.nombre || "Consulta"}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                              Detalles de la reserva del paciente
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-3 py-3 text-xs">
                            <Badge variant="secondary" className="w-fit">
                              {getCitaAreaLabel(cita.tipo_citas?.area)}
                            </Badge>
                            <div className="flex items-start gap-2.5">
                              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <div>
                                <span className="block font-semibold">Horario</span>
                                <span className="text-muted-foreground">
                                  {format(parseISO(cita.start_date), "EEEE d 'de' MMMM", { locale: es })}
                                </span>
                                <span className="mt-0.5 block font-semibold text-primary">
                                  {format(parseISO(cita.start_date), "HH:mm")} - {format(parseISO(cita.end_date), "HH:mm")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 border-t pt-2.5">
                              <PawPrint className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <div>
                                <span className="block font-semibold">Paciente</span>
                                {cita.mascota_id ? (
                                  <Link
                                    href={`/mascotas/${cita.mascota_id}`}
                                    className="font-semibold text-primary hover:underline"
                                  >
                                    {cita.mascotas?.nombre || "Paciente desconocido"}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">Desconocida</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 border-t pt-2.5">
                              <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <div>
                                <span className="block font-semibold">Responsable</span>
                                <span className="font-medium text-muted-foreground">
                                  {cita.clientes?.nombre || "Desconocido"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t pt-3 space-y-3">
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
                            />
                          </div>
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
