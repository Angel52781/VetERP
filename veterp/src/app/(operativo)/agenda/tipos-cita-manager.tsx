"use client";

import { useMemo, useState, useTransition } from "react";
import { Edit2, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setTipoCitaDisabled } from "./actions";
import { TipoCitaForm } from "./tipo-cita-form";
import { AREA_META, AREA_ORDER, normalizeCitaArea, type CitaArea, type TipoCitaAgenda } from "./types";

type EstadoFiltro = "todos" | "activos" | "inactivos";
type AreaFiltro = "todas" | CitaArea;

interface TiposCitaManagerProps {
  tiposCita: TipoCitaAgenda[];
}

export function TiposCitaManager({ tiposCita }: TiposCitaManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [areaFiltro, setAreaFiltro] = useState<AreaFiltro>("todas");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredTipos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tiposCita.filter((tipo) => {
      const area = normalizeCitaArea(tipo.area);
      const matchesArea = areaFiltro === "todas" || area === areaFiltro;
      const matchesStatus =
        estadoFiltro === "todos" ||
        (estadoFiltro === "activos" && !tipo.is_disabled) ||
        (estadoFiltro === "inactivos" && Boolean(tipo.is_disabled));
      const areaLabel = AREA_META[area].label.toLowerCase();
      const matchesSearch = !query || tipo.nombre.toLowerCase().includes(query) || areaLabel.includes(query);
      return matchesArea && matchesStatus && matchesSearch;
    });
  }, [areaFiltro, estadoFiltro, search, tiposCita]);

  const groupedTipos = AREA_ORDER.map((area) => ({
    area,
    tipos: filteredTipos
      .filter((tipo) => normalizeCitaArea(tipo.area) === area)
      .sort((a, b) => Number(a.is_disabled) - Number(b.is_disabled) || a.nombre.localeCompare(b.nombre, "es")),
  })).filter((group) => group.tipos.length > 0);

  function toggleDisabled(tipo: TipoCitaAgenda) {
    startTransition(async () => {
      const nextDisabled = !tipo.is_disabled;
      const result = await setTipoCitaDisabled(tipo.id, { disabled: nextDisabled });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(nextDisabled ? "Tipo de cita desactivado." : "Tipo de cita reactivado.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Configuración de tipos de cita</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Edita duración, color, área y visibilidad. Los tipos inactivos no aparecen en nuevas citas.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button variant="outline" className="w-full sm:w-auto" />}>
              <Plus className="mr-2 h-4 w-4" />
              Crear tipo
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo tipo de cita</DialogTitle>
              </DialogHeader>
              <TipoCitaForm onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o área"
              className="pl-8"
            />
          </div>
          <Select value={areaFiltro} onValueChange={(value) => setAreaFiltro(value as AreaFiltro)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las áreas</SelectItem>
              {AREA_ORDER.map((area) => (
                <SelectItem key={area} value={area}>
                  {AREA_META[area].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={estadoFiltro} onValueChange={(value) => setEstadoFiltro(value as EstadoFiltro)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {groupedTipos.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No hay tipos de cita para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedTipos.map((group) => (
              <section key={group.area} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {AREA_META[group.area].label}
                </h3>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {group.tipos.map((tipo) => (
                    <div key={tipo.id} className="rounded-lg border bg-background p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tipo.color || "#64748b" }} />
                            <p className="truncate text-sm font-semibold">{tipo.nombre}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{tipo.duracion_min} min</p>
                        </div>
                        <Badge variant={tipo.is_disabled ? "outline" : "secondary"}>
                          {tipo.is_disabled ? "Inactivo" : "Activo"}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Dialog open={editingId === tipo.id} onOpenChange={(open) => setEditingId(open ? tipo.id : null)}>
                          <DialogTrigger render={<Button size="sm" variant="outline" className="w-full sm:w-auto" />}>
                            <Edit2 className="mr-2 h-3.5 w-3.5" />
                            Editar
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar tipo de cita</DialogTitle>
                            </DialogHeader>
                            <TipoCitaForm tipoCita={tipo} onSuccess={() => setEditingId(null)} />
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant={tipo.is_disabled ? "secondary" : "ghost"}
                          onClick={() => toggleDisabled(tipo)}
                          disabled={pending}
                          className="w-full sm:w-auto"
                        >
                          {tipo.is_disabled ? (
                            <ToggleRight className="mr-2 h-3.5 w-3.5" />
                          ) : (
                            <ToggleLeft className="mr-2 h-3.5 w-3.5" />
                          )}
                          {tipo.is_disabled ? "Reactivar" : "Desactivar"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
