"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CitaForm } from "./cita-form";
import type { TipoCitaAgenda } from "./types";

type EditableCita = {
  id: string;
  estado?: string | null;
  cliente_id: string;
  mascota_id: string;
  tipo_cita_id: string;
  start_date: string;
  end_date: string;
};

interface EditarCitaBtnProps {
  cita: EditableCita;
  clientes: { id: string; nombre: string }[];
  tiposCita: TipoCitaAgenda[];
  compact?: boolean;
}

export function EditarCitaBtn({ cita, clientes, tiposCita, compact = false }: EditarCitaBtnProps) {
  const [open, setOpen] = useState(false);
  const canEdit = ["programada", "confirmada"].includes(cita.estado ?? "programada");

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size={compact ? "sm" : "default"} className={compact ? "h-7 px-2 text-xs" : undefined} />
        }
      >
        <Pencil className="mr-1 h-3.5 w-3.5" />
        Editar cita
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cita</DialogTitle>
        </DialogHeader>
        {open && (
          <CitaForm
            citaId={cita.id}
            clientes={clientes}
            tiposCita={tiposCita}
            initialValues={{
              cliente_id: cita.cliente_id,
              mascota_id: cita.mascota_id,
              tipo_cita_id: cita.tipo_cita_id,
              start_date: cita.start_date,
              end_date: cita.end_date,
            }}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
