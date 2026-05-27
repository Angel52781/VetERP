"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock, PauseCircle, Pill } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  suspenderTratamientoHospitalizacion,
  terminarTratamientoHospitalizacion,
} from "./actions";
import { EditarTratamientoDialog } from "./editar-tratamiento-dialog";
import { NuevoTratamientoDialog } from "./nuevo-tratamiento-dialog";

export type TratamientoHospitalizacionItem = {
  id: string;
  clinica_id: string;
  hospitalizacion_id: string;
  mascota_id: string;
  nombre_text: string;
  dosis_text: string | null;
  via_text: string | null;
  frecuencia_text: string | null;
  indicaciones_text: string | null;
  responsable_text: string | null;
  notas_text: string | null;
  orden_num: number | null;
  estado_text: "activo" | "terminado" | "suspendido" | string;
  iniciado_at: string;
  terminado_at: string | null;
  created_at: string;
  updated_at: string;
};

type TratamientosHospitalizacionCardProps = {
  hospitalizacionId: string;
  mascotaId: string;
  pacienteNombre: string;
  estadoHospitalizacion: string;
  tratamientos: TratamientoHospitalizacionItem[];
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });
}

function getEstadoBadge(estado: string) {
  if (estado === "terminado") {
    return <Badge className="bg-emerald-100 text-emerald-800 border-none">Terminado</Badge>;
  }
  if (estado === "suspendido") {
    return <Badge className="bg-amber-100 text-amber-900 border-none">Suspendido</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800 border-none">Activo</Badge>;
}

function TratamientoItem({
  tratamiento,
  canManage,
  pendingAction,
  onTerminar,
  onSuspender,
}: {
  tratamiento: TratamientoHospitalizacionItem;
  canManage: boolean;
  pendingAction: string | null;
  onTerminar: (tratamiento: TratamientoHospitalizacionItem) => void;
  onSuspender: (tratamiento: TratamientoHospitalizacionItem) => void;
}) {
  const details = [
    { label: "Dosis", value: tratamiento.dosis_text },
    { label: "Via", value: tratamiento.via_text },
    { label: "Frecuencia", value: tratamiento.frecuencia_text },
    { label: "Responsable", value: tratamiento.responsable_text },
  ].filter((item) => item.value?.trim());
  const isActivo = tratamiento.estado_text === "activo";
  const terminarKey = `terminar-${tratamiento.id}`;
  const suspenderKey = `suspender-${tratamiento.id}`;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{tratamiento.nombre_text}</p>
            {getEstadoBadge(tratamiento.estado_text)}
            {typeof tratamiento.orden_num === "number" ? (
              <Badge variant="outline">Orden {tratamiento.orden_num}</Badge>
            ) : null}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Inicio: {formatDateTime(tratamiento.iniciado_at)}
          </p>
          {tratamiento.terminado_at ? (
            <p className="text-xs text-muted-foreground">
              Cierre: {formatDateTime(tratamiento.terminado_at)}
            </p>
          ) : null}
        </div>

        {canManage && isActivo ? (
          <div className="flex flex-wrap gap-2">
            <EditarTratamientoDialog tratamiento={tratamiento} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(pendingAction)}
              onClick={() => onTerminar(tratamiento)}
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              {pendingAction === terminarKey ? "Marcando..." : "Terminar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={Boolean(pendingAction)}
              onClick={() => onSuspender(tratamiento)}
            >
              <PauseCircle className="mr-2 h-3.5 w-3.5" />
              {pendingAction === suspenderKey ? "Suspendiendo..." : "Suspender"}
            </Button>
          </div>
        ) : null}
      </div>

      {details.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tratamiento.indicaciones_text ? (
        <div className="mt-3 rounded-md border bg-background px-3 py-2 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Indicaciones
          </p>
          <p className="mt-1 whitespace-pre-wrap">{tratamiento.indicaciones_text}</p>
        </div>
      ) : null}

      {tratamiento.notas_text ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="text-[11px] font-semibold uppercase tracking-wider">Notas</p>
          <p className="mt-1 whitespace-pre-wrap">{tratamiento.notas_text}</p>
        </div>
      ) : null}
    </div>
  );
}

export function TratamientosHospitalizacionCard({
  hospitalizacionId,
  mascotaId,
  pacienteNombre,
  estadoHospitalizacion,
  tratamientos,
}: TratamientosHospitalizacionCardProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const isHospitalizacionActiva = estadoHospitalizacion === "activa";
  const activos = tratamientos.filter((tratamiento) => tratamiento.estado_text === "activo");
  const historicos = tratamientos.filter((tratamiento) => tratamiento.estado_text !== "activo");

  function cambiarEstado(tratamiento: TratamientoHospitalizacionItem, estado: "terminar" | "suspender") {
    const pendingKey = `${estado}-${tratamiento.id}`;
    setPendingAction(pendingKey);
    startTransition(async () => {
      const result =
        estado === "terminar"
          ? await terminarTratamientoHospitalizacion({
              id: tratamiento.id,
              hospitalizacion_id: tratamiento.hospitalizacion_id,
              mascota_id: tratamiento.mascota_id,
            })
          : await suspenderTratamientoHospitalizacion({
              id: tratamiento.id,
              hospitalizacion_id: tratamiento.hospitalizacion_id,
              mascota_id: tratamiento.mascota_id,
            });

      if (result.error) {
        toast.error(result.error);
        setPendingAction(null);
        return;
      }

      toast.success(estado === "terminar" ? "Tratamiento terminado" : "Tratamiento suspendido");
      setPendingAction(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" />
              Tratamiento
            </CardTitle>
            <CardDescription>
              Ficha operativa de tratamientos dentro del internamiento.
            </CardDescription>
          </div>
          {isHospitalizacionActiva ? (
            <NuevoTratamientoDialog
              hospitalizacionId={hospitalizacionId}
              mascotaId={mascotaId}
              pacienteNombre={pacienteNombre}
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!isHospitalizacionActiva ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Hospitalizacion cerrada: tratamientos en modo lectura.
          </div>
        ) : null}

        {tratamientos.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center">
            <Pill className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium">No hay tratamientos registrados.</p>
            {isHospitalizacionActiva ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Usa Agregar tratamiento para crear la primera ficha operativa.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Activos</h3>
                <Badge variant="secondary">{activos.length}</Badge>
              </div>
              {activos.length ? (
                <div className="space-y-3">
                  {activos.map((tratamiento) => (
                    <TratamientoItem
                      key={tratamiento.id}
                      tratamiento={tratamiento}
                      canManage={isHospitalizacionActiva}
                      pendingAction={pendingAction}
                      onTerminar={(item) => cambiarEstado(item, "terminar")}
                      onSuspender={(item) => cambiarEstado(item, "suspender")}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  No hay tratamientos activos.
                </p>
              )}
            </section>

            {historicos.length ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Terminados / Suspendidos</h3>
                  <Badge variant="secondary">{historicos.length}</Badge>
                </div>
                <div className="space-y-3">
                  {historicos.map((tratamiento) => (
                    <TratamientoItem
                      key={tratamiento.id}
                      tratamiento={tratamiento}
                      canManage={false}
                      pendingAction={pendingAction}
                      onTerminar={(item) => cambiarEstado(item, "terminar")}
                      onSuspender={(item) => cambiarEstado(item, "suspender")}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
