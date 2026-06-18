"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { NuevaAtencionForm } from "@/app/(operativo)/index/nueva-atencion-form";
import { CitaForm } from "@/app/(operativo)/agenda/cita-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AccionesContextualesClienteProps {
  clienteId: string;
  clienteNombre: string;
  tiposCita: { id: string; nombre: string; duracion_min: number }[];
}

export function AccionesContextualesCliente({
  clienteId,
  clienteNombre,
  tiposCita,
}: AccionesContextualesClienteProps) {
  const [citaDialogOpen, setCitaDialogOpen] = useState(false);
  const clientes = [{ id: clienteId, nombre: clienteNombre }];

  return (
    <div className="flex items-center gap-2">
      <NuevaAtencionForm
        clientes={clientes}
        initialClienteId={clienteId}
        triggerSize="sm"
      />

      <Dialog open={citaDialogOpen} onOpenChange={setCitaDialogOpen}>
        <DialogTrigger render={<Button variant="secondary" size="sm" />}>
          <CalendarDays className="mr-1.5 h-4 w-4" />
          Agendar Cita
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Programar Cita</DialogTitle>
          </DialogHeader>
          {citaDialogOpen && (
            <CitaForm
              clientes={clientes}
              tiposCita={tiposCita}
              initialClienteId={clienteId}
              onSuccess={() => setCitaDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

