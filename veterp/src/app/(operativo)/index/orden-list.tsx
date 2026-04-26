"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateEstadoOrden } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical, Play, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

type Orden = {
  id: string;
  estado_text: string;
  started_at: string;
  clientes: { id: string; nombre: string } | null;
  mascotas: { id: string; nombre: string } | null;
};

interface OrdenListProps {
  ordenes: Orden[];
}

const ESTADOS: Record<string, { label: string; bgClass: string; textClass: string; icon: any }> = {
  open: { label: "Abierta", bgClass: "bg-secondary", textClass: "text-secondary-foreground", icon: Clock },
  in_progress: { label: "En Progreso", bgClass: "bg-primary", textClass: "text-primary-foreground", icon: Play },
  finished: { label: "Finalizada", bgClass: "bg-green-100", textClass: "text-green-800", icon: CheckCircle },
  closed: { label: "Cerrada", bgClass: "bg-muted", textClass: "text-muted-foreground", icon: CheckCircle },
};

export function OrdenList({ ordenes }: OrdenListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleEstadoChange(id: string, nuevoEstado: string) {
    setLoadingId(id);
    const { error } = await updateEstadoOrden(id, nuevoEstado);
    setLoadingId(null);

    if (error) {
      toast.error(error);
      return;
    }

    const mensajes: Record<string, string> = {
      in_progress: "Orden marcada como En progreso.",
      finished: "Orden finalizada. Ya no aparece en Atenciones activas.",
      closed: "Orden cerrada. Ya no aparece en Atenciones activas.",
    };
    toast.success(mensajes[nuevoEstado] ?? "Estado actualizado.");
    router.refresh();
  }

  if (!ordenes || ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-muted/30">
        <div className="bg-background p-4 rounded-full shadow-sm mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">No hay pacientes en atención</h3>
        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
          Aquí aparecerán las mascotas que están siendo atendidas actualmente en la clínica.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ordenes.map((orden) => {
        const estadoInfo = ESTADOS[orden.estado_text as keyof typeof ESTADOS] || ESTADOS.open;
        const Icon = estadoInfo.icon;

        return (
          <Card key={orden.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-primary">
                  {orden.mascotas?.nombre || "Mascota"}
                </CardTitle>
                <CardDescription className="font-medium">
                  Dueño: {orden.clientes?.nombre || "Cliente"}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={loadingId === orden.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="sr-only">Abrir menú</span>
                  {loadingId === orden.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {orden.estado_text === "open" && (
                    <DropdownMenuItem onClick={() => handleEstadoChange(orden.id, "in_progress")}>
                      Comenzar Atención
                    </DropdownMenuItem>
                  )}
                  {orden.estado_text === "in_progress" && (
                    <DropdownMenuItem onClick={() => handleEstadoChange(orden.id, "finished")}>
                      Finalizar Atención
                    </DropdownMenuItem>
                  )}
                  {(orden.estado_text === "open" || orden.estado_text === "in_progress") && (
                    <DropdownMenuItem onClick={() => handleEstadoChange(orden.id, "closed")} className="text-destructive">
                      Anular Orden
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                <Icon className="h-3.5 w-3.5" />
                <span>
                  Iniciada: {orden.started_at
                    ? format(new Date(orden.started_at), "dd MMM, HH:mm", { locale: es })
                    : "Sin fecha"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="mt-auto flex justify-between gap-2 pt-4">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${estadoInfo.bgClass} ${estadoInfo.textClass}`}>
                {estadoInfo.label}
              </span>
              <Link 
                href={`/orden_y_colas/${orden.id}`} 
                className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-2.5 text-xs font-semibold hover:bg-muted hover:text-foreground transition-colors"
              >
                Ver Ficha Clínica
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
