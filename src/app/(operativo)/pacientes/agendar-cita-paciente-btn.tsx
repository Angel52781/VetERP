"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { CitaForm } from "@/app/(operativo)/agenda/cita-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AgendarCitaPacienteBtnProps {
  clienteId: string;
  clienteNombre: string;
  mascotaId: string;
  tiposCita: { id: string; nombre: string; duracion_min: number }[];
}

export function AgendarCitaPacienteBtn({
  clienteId,
  clienteNombre,
  mascotaId,
  tiposCita,
}: AgendarCitaPacienteBtnProps) {
  const [open, setOpen] = useState(false);
  const clientes = [{ id: clienteId, nombre: clienteNombre }];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" size="sm" className="h-8" />}>
        <CalendarDays className="mr-1.5 h-4 w-4" />
        Agendar Cita
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Programar Cita</DialogTitle>
        </DialogHeader>
        {open && (
          <CitaForm
            clientes={clientes}
            tiposCita={tiposCita}
            initialClienteId={clienteId}
            initialValues={{
              cliente_id: clienteId,
              mascota_id: mascotaId,
            }}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
