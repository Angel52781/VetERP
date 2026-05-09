"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  NotebookPen,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getGroomingStatusMeta, getToneBadgeClass } from "@/lib/operational-status";
import {
  guardarGroomingServicio,
  marcarGroomingCompletado,
  marcarGroomingPendiente,
} from "./actions";

interface GroomingCardProps {
  cita: {
    id: string;
    start_date: string;
    estado: string;
    tipo_citas: { nombre: string; color: string; area: string } | null;
    clientes: { id: string; nombre: string; telefono?: string | null } | null;
    mascotas: {
      id: string;
      nombre: string;
      especie?: string | null;
      raza?: string | null;
      alertas_criticas?: string | null;
      notas_manejo?: string | null;
    } | null;
    grooming_servicios: {
      id?: string;
      estado_text: string;
      observaciones_text?: string | null;
      servicios_realizados_text?: string | null;
      completado_at?: string | null;
    }[] | null;
  };
}

function formatHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function shortText(value: string, max = 90) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

export function GroomingCard({ cita }: GroomingCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const gs = cita.grooming_servicios?.[0];
  const isCompletado = gs?.estado_text === "completado";
  const groomingMeta = getGroomingStatusMeta(isCompletado ? "completado" : "pendiente");

  const [obs, setObs] = useState(gs?.observaciones_text ?? "");
  const [servicios, setServicios] = useState(gs?.servicios_realizados_text ?? "");

  const mascota = cita.mascotas;
  const cliente = cita.clientes;
  const tipo = cita.tipo_citas;

  const baseInput = {
    cita_id: cita.id,
    mascota_id: mascota?.id ?? "",
    cliente_id: cliente?.id ?? "",
    estado_text: "pendiente" as const,
    observaciones_text: obs,
    servicios_realizados_text: servicios,
  };

  function handleGuardar() {
    startTransition(async () => {
      const result = await guardarGroomingServicio(baseInput);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Guardado correctamente.");
      router.refresh();
    });
  }

  function handleCompletar() {
    startTransition(async () => {
      const result = await marcarGroomingCompletado(baseInput);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Servicio marcado como completado.");
      router.refresh();
    });
  }

  function handlePendiente() {
    startTransition(async () => {
      const result = await marcarGroomingPendiente(baseInput);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Servicio marcado como pendiente.");
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors",
        isCompletado && "border-emerald-200 bg-emerald-50/30"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-md bg-muted px-3 py-2 text-center">
            <p className="text-sm font-black tabular-nums">{formatHora(cita.start_date)}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Hora</p>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm">{mascota?.nombre ?? "Sin paciente"}</p>
              {mascota?.especie && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium uppercase">
                  {mascota.especie}
                </span>
              )}
              {mascota?.raza && <span className="text-xs text-muted-foreground">{mascota.raza}</span>}
            </div>

            <p className="text-xs text-muted-foreground">
              {cliente?.nombre ?? "Sin responsable"}
              {cliente?.telefono ? ` · ${cliente.telefono}` : ""}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {tipo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tipo.color ?? "#94a3b8" }} />
                  {tipo.nombre}
                </span>
              )}
              {mascota?.alertas_criticas?.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Alerta: {shortText(mascota.alertas_criticas, 42)}
                </span>
              )}
              {mascota?.notas_manejo?.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 ring-1 ring-amber-200">
                  <NotebookPen className="h-3 w-3" />
                  Manejo: {shortText(mascota.notas_manejo, 42)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${getToneBadgeClass(groomingMeta.tone)}`}>
            {isCompletado ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {groomingMeta.label}
          </span>

          {mascota?.id && (
            <Link href={`/mascotas/${mascota.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
              Ver ficha
            </Link>
          )}

          <Button size="sm" variant="secondary" onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? <ChevronUp className="mr-2 h-3.5 w-3.5" /> : <ChevronDown className="mr-2 h-3.5 w-3.5" />}
            {isOpen ? "Cerrar" : "Ver detalles"}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {mascota?.alertas_criticas?.trim() && (
            <div className="flex items-start gap-2 rounded bg-destructive/10 border border-destructive/30 px-3 py-2 text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">Alerta crítica</p>
                <p className="text-xs mt-0.5">{mascota.alertas_criticas}</p>
              </div>
            </div>
          )}

          {mascota?.notas_manejo?.trim() && (
            <div className="flex items-start gap-2 rounded bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
              <NotebookPen className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Notas de manejo</p>
                <p className="text-xs mt-0.5">{mascota.notas_manejo}</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`servicios-${cita.id}`} className="text-xs font-semibold">
                Servicios realizados
              </Label>
              <Textarea
                id={`servicios-${cita.id}`}
                rows={3}
                className="resize-none text-sm"
                placeholder="Ej: Baño medicado, corte de uñas, limpieza de oídos..."
                value={servicios}
                onChange={(event) => setServicios(event.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`obs-${cita.id}`} className="text-xs font-semibold">
                Observaciones
              </Label>
              <Textarea
                id={`obs-${cita.id}`}
                rows={3}
                className="resize-none text-sm"
                placeholder="Comportamiento, incidentes, recomendaciones..."
                value={obs}
                onChange={(event) => setObs(event.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleGuardar} disabled={pending}>
              {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Guardar
            </Button>
            {!isCompletado ? (
              <Button size="sm" onClick={handleCompletar} disabled={pending}>
                {pending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                )}
                Marcar completado
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={handlePendiente} disabled={pending}>
                Reabrir / pendiente
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
