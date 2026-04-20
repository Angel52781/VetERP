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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

    toast.success("Estado actualizado exitosamente");
    router.refresh();
  }

  if (!ordenes || ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
        <h3 className="text-lg font-medium">No hay atenciones activas</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Crea una nueva atención para comenzar a registrar servicios.
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
          <Card key={orden.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  Mascota: {orden.mascotas?.nombre || "Desconocida"}
                </CardTitle>
                <CardDescription>
                  Cliente: {orden.clientes?.nombre || "Desconocido"}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" disabled={loadingId === orden.id} />}>
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
                      Marcar En Progreso
                    </DropdownMenuItem>
                  )}
                  {orden.estado_text === "in_progress" && (
                    <DropdownMenuItem onClick={() => handleEstadoChange(orden.id, "finished")}>
                      Marcar Finalizada
                    </DropdownMenuItem>
                  )}
                  {(orden.estado_text === "open" || orden.estado_text === "in_progress") && (
                    <DropdownMenuItem onClick={() => handleEstadoChange(orden.id, "closed")}>
                      Cerrar Orden
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                <Icon className="h-4 w-4" />
                <span>
                  {orden.started_at
                    ? format(new Date(orden.started_at), "dd MMM yyyy HH:mm", { locale: es })
                    : "Sin fecha"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="mt-auto flex justify-between">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoInfo.bgClass} ${estadoInfo.textClass}`}>
                {estadoInfo.label}
              </span>
              <Link href={`/atenciones/${orden.id}`} className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted hover:text-foreground">
                Ver Detalle
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
