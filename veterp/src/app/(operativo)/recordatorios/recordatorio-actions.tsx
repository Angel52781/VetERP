"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  cancelarSeguimientoClinico,
  reprogramarSeguimientoClinico,
  resolverSeguimientoClinico,
} from "@/app/(operativo)/mascotas/[id]/actions";

type RecordatorioActionsProps = {
  id: string;
  fechaActual: string;
};

export function RecordatorioActions({ id, fechaActual }: RecordatorioActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(fechaActual);

  const handleResolve = () => {
    if (!window.confirm("Marcar este recordatorio como resuelto?")) return;

    startTransition(async () => {
      const result = await resolverSeguimientoClinico(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Recordatorio resuelto");
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!window.confirm("Cancelar este recordatorio?")) return;

    startTransition(async () => {
      const result = await cancelarSeguimientoClinico(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Recordatorio cancelado");
      router.refresh();
    });
  };

  const handleReschedule = () => {
    startTransition(async () => {
      const result = await reprogramarSeguimientoClinico(id, nuevaFecha);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Recordatorio reprogramado");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={handleResolve} disabled={isPending}>
        Resolver
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm" disabled={isPending}>
              Reprogramar
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar recordatorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`fecha-${id}`}>
              Nueva fecha
            </label>
            <Input
              id={`fecha-${id}`}
              type="date"
              value={nuevaFecha}
              onChange={(event) => setNuevaFecha(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleReschedule}
              disabled={isPending || !nuevaFecha}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button type="button" variant="destructive" size="sm" onClick={handleCancel} disabled={isPending}>
        Cancelar
      </Button>
    </div>
  );
}
