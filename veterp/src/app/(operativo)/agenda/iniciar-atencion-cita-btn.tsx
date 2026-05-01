"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createOrdenServicio } from "../index/actions";
import { updateCitaEstado } from "./actions";

type IniciarAtencionCitaBtnProps = {
  citaId?: string;
  clienteId: string;
  mascotaId: string;
  citaEstado?: string | null;
  citaStartDate?: string | null;
  activeOrderId?: string | null;
  activeOrderEstadoText?: string | null;
  compact?: boolean;
};

export function IniciarAtencionCitaBtn({
  citaId,
  clienteId,
  mascotaId,
  citaEstado,
  citaStartDate,
  activeOrderId,
  activeOrderEstadoText,
  compact = false,
}: IniciarAtencionCitaBtnProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const hasActiveOrder = Boolean(activeOrderId);
  const estadoActual = citaEstado ?? "programada";
  const isTerminalEstado = estadoActual === "cancelada" || estadoActual === "no_asistio";
  const isCompletada = estadoActual === "completada";
  const isLlegada = estadoActual === "llego";
  const isEnAtencion = estadoActual === "en_atencion";
  const startMs = citaStartDate ? new Date(citaStartDate).getTime() : NaN;
  const msToStart = Number.isNaN(startMs) ? -1 : startMs - Date.now();
  const withinEarlyWindow = msToStart <= 120 * 60 * 1000;

  async function marcarCitaEnAtencionSiAplica() {
    if (!citaId) return;
    if (estadoActual === "en_atencion") return;
    if (estadoActual === "cancelada" || estadoActual === "no_asistio" || estadoActual === "completada") return;
    if (estadoActual !== "llego") return;

    const { error } = await updateCitaEstado(citaId, "en_atencion");
    if (error) {
      console.error("No se pudo marcar cita en atención:", error);
    }
  }

  async function handleIniciarAtencion() {
    if (isEnAtencion && hasActiveOrder && activeOrderId) {
      router.push(`/orden_y_colas/${activeOrderId}`);
      return;
    }

    if (!isLlegada || !withinEarlyWindow) return;

    if (hasActiveOrder && activeOrderId) {
      await marcarCitaEnAtencionSiAplica();
      toast.info("Ya existe una atención activa para este paciente. Abriendo atención...");
      router.push(`/orden_y_colas/${activeOrderId}`);
      return;
    }

    setIsLoading(true);
    const { data, error } = await createOrdenServicio({
      cliente_id: clienteId,
      mascota_id: mascotaId,
    });
    setIsLoading(false);

    if (error) {
      if (data?.id) {
        await marcarCitaEnAtencionSiAplica();
        toast.info("Este paciente ya tiene una atencion activa. Redirigiendo...");
        router.push(`/orden_y_colas/${data.id}`);
        return;
      }

      toast.error(error);
      return;
    }

    if (data?.id) {
      await marcarCitaEnAtencionSiAplica();
      toast.success("Atención iniciada correctamente.");
      router.push(`/orden_y_colas/${data.id}`);
    }
  }

  if (isTerminalEstado || isCompletada) {
    return null;
  }

  const isDisabledByFlow = !isLlegada && !isEnAtencion;
  const isDisabledByTime = isLlegada && !withinEarlyWindow;
  const title =
    isDisabledByTime
      ? "La cita está fuera de la ventana anticipada de 120 minutos"
      : isDisabledByFlow
      ? "Marca primero la cita como 'Llegó'"
      : isEnAtencion && !hasActiveOrder
      ? "No hay una atención activa para esta cita"
      : undefined;
  const label =
    isEnAtencion
      ? "Ver atención"
      : isDisabledByFlow || isDisabledByTime
      ? "Requiere llegada"
      : "Iniciar atención";

  return (
    <Button
      type="button"
      size={compact ? "sm" : "default"}
      variant={compact ? "outline" : "default"}
      className={compact ? "h-8" : undefined}
      onClick={handleIniciarAtencion}
      disabled={isLoading || (isEnAtencion ? !hasActiveOrder : isDisabledByFlow || isDisabledByTime)}
      title={title}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Stethoscope className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}
