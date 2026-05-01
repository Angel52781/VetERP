"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateCitaEstado } from "./actions";

type CitaEstadoControlProps = {
  citaId: string;
  estado?: string | null;
  startDate?: string | null;
  compact?: boolean;
};

const ESTADO_META: Record<string, { label: string; badgeClass: string }> = {
  programada: { label: "Programada", badgeClass: "bg-secondary text-secondary-foreground" },
  confirmada: { label: "Confirmada", badgeClass: "bg-blue-100 text-blue-800" },
  llego: { label: "Llegó", badgeClass: "bg-amber-100 text-amber-800" },
  en_atencion: { label: "En atención", badgeClass: "bg-indigo-100 text-indigo-800" },
  cancelada: { label: "Cancelada", badgeClass: "bg-red-100 text-red-800" },
  no_asistio: { label: "No asistió", badgeClass: "bg-orange-100 text-orange-800" },
  completada: { label: "Completada", badgeClass: "bg-green-100 text-green-800" },
};

const FALLBACK_META = ESTADO_META.programada;

function getAllowedActions(estado: string) {
  if (estado === "programada") {
    return [
      { estado: "confirmada", label: "Confirmar" },
      { estado: "llego", label: "Marcar llegó" },
      { estado: "cancelada", label: "Cancelar" },
      { estado: "no_asistio", label: "No asistió" },
    ];
  }

  if (estado === "confirmada") {
    return [
      { estado: "llego", label: "Marcar llegó" },
      { estado: "cancelada", label: "Cancelar" },
      { estado: "no_asistio", label: "No asistió" },
    ];
  }

  return [];
}

export function CitaEstadoControl({ citaId, estado, startDate, compact = false }: CitaEstadoControlProps) {
  const router = useRouter();
  const [loadingEstado, setLoadingEstado] = useState<string | null>(null);

  const estadoActual = estado ?? "programada";
  const startMs = startDate ? new Date(startDate).getTime() : NaN;
  const nowMs = Date.now();
  const msToStart = Number.isNaN(startMs) ? -1 : startMs - nowMs;
  const isFuture = msToStart > 0;
  const isFutureFar = msToStart > 120 * 60 * 1000;
  const meta = ESTADO_META[estadoActual] ?? FALLBACK_META;
  const actions = (() => {
    if (isFutureFar) {
      if (estadoActual === "programada") {
        return [
          { estado: "confirmada", label: "Confirmar" },
          { estado: "cancelada", label: "Cancelar" },
        ];
      }
      if (estadoActual === "confirmada") {
        return [{ estado: "cancelada", label: "Cancelar" }];
      }
      return [];
    }

    if (isFuture) {
      if (estadoActual === "programada") {
        return [
          { estado: "confirmada", label: "Confirmar" },
          { estado: "llego", label: "Marcar llegó" },
          { estado: "cancelada", label: "Cancelar" },
        ];
      }
      if (estadoActual === "confirmada") {
        return [
          { estado: "llego", label: "Marcar llegó" },
          { estado: "cancelada", label: "Cancelar" },
        ];
      }
      return [];
    }

    return getAllowedActions(estadoActual);
  })();

  async function handleChangeEstado(nextEstado: string) {
    setLoadingEstado(nextEstado);
    const { error } = await updateCitaEstado(citaId, nextEstado);
    setLoadingEstado(null);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(`Cita marcada como ${ESTADO_META[nextEstado]?.label ?? nextEstado}.`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded-full ${meta.badgeClass}`}>{meta.label}</span>
      {actions.map((action) => (
        <Button
          key={`${citaId}-${action.estado}`}
          type="button"
          size={compact ? "sm" : "default"}
          variant="ghost"
          className={compact ? "h-7 px-2 text-xs" : undefined}
          disabled={loadingEstado !== null}
          onClick={() => handleChangeEstado(action.estado)}
        >
          {loadingEstado === action.estado ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : null}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
