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
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {dateCitas.map((cita) => (
                    <Card key={cita.id} className="overflow-hidden">
                      <div
                        className="h-2 w-full"
                        style={{ backgroundColor: cita.tipo_citas?.color || "#ccc" }}
                      />
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg flex justify-between items-center">
                          <span>{cita.tipo_citas?.nombre || "Cita"}</span>
                          <span className="text-sm font-normal text-muted-foreground flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(parseISO(cita.start_date), "HH:mm")}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-sm space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <User className="mr-2 h-4 w-4" />
                          {cita.clientes?.nombre || "Cliente desconocido"}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <PawPrint className="mr-2 h-4 w-4" />
                          {cita.mascotas?.nombre || "Mascota desconocida"}
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
    </div>
  );
}
