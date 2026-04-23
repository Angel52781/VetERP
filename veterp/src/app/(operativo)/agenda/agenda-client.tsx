"use client";

import { useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar, Clock, User, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type Cita = {
  id: string;
  start_date: string;
  end_date: string;
  clientes: { nombre: string } | null;
  mascotas: { nombre: string } | null;
  tipo_citas: { nombre: string; color: string } | null;
};

interface AgendaClientProps {
  citas: Cita[];
  clientes: { id: string; nombre: string; apellidos: string | null }[];
  tiposCita: { id: string; nombre: string; duracion_min: number }[];
}

export function AgendaClient({ citas, clientes, tiposCita }: AgendaClientProps) {
  const [citaDialogOpen, setCitaDialogOpen] = useState(false);
  const [tipoCitaDialogOpen, setTipoCitaDialogOpen] = useState(false);

  // Group citas by day
  const groupedCitas = citas.reduce((acc, cita) => {
    const dateStr = cita.start_date.split("T")[0];
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(cita);
    return acc;
  }, {} as Record<string, Cita[]>);

  const sortedDates = Object.keys(groupedCitas).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gestiona las citas y horarios de la clínica.
          </p>
        </div>
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

      <div className="space-y-8">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay citas programadas para el periodo seleccionado.
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
                <div className="flex flex-col gap-2">
                  {dateCitas.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center min-w-[70px] border-r pr-4">
                          <span className="text-lg font-bold text-primary">
                            {format(parseISO(cita.start_date), "HH:mm")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(cita.end_date), "HH:mm")}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm"
                              style={{ backgroundColor: cita.tipo_citas?.color || "#6b7280" }}
                            >
                              {cita.tipo_citas?.nombre || "Cita"}
                            </span>
                          </div>
                          <div className="flex items-center text-sm gap-4 mt-0.5">
                            <div className="flex items-center">
                              <User className="mr-1.5 h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{cita.clientes?.nombre || "Sin cliente"}</span>
                            </div>
                            <div className="flex items-center">
                              <PawPrint className="mr-1.5 h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{cita.mascotas?.nombre || "Sin mascota"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
