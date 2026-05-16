"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createMascota } from "@/app/(operativo)/clientes/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SPECIES_OPTIONS } from "@/lib/patient-labels";
import { mascotaSchema, type MascotaFormValues } from "@/lib/validators/clientes";

type ClienteOption = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
};

type NuevoPacienteDialogProps = {
  clientes: ClienteOption[];
};

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function NuevoPacienteDialog({ clientes }: NuevoPacienteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clienteQuery, setClienteQuery] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<MascotaFormValues>({
    resolver: zodResolver(mascotaSchema),
    defaultValues: {
      nombre: "",
      codigo_text: "",
      especie: "",
      raza: "",
      nacimiento: "",
      alertas_criticas: "",
      notas_manejo: "",
    },
  });

  const selectedCliente = useMemo(
    () => clientes.find((cliente) => cliente.id === selectedClienteId) ?? null,
    [clientes, selectedClienteId],
  );

  const filteredClientes = useMemo(() => {
    const query = normalizeSearch(clienteQuery.trim());
    if (!query) return clientes.slice(0, 20);

    return clientes
      .filter((cliente) => {
        const searchable = [
          cliente.nombre,
          cliente.telefono,
          cliente.email,
        ]
          .map(normalizeSearch)
          .join(" ");

        return searchable.includes(query);
      })
      .slice(0, 30);
  }, [clientes, clienteQuery]);

  function resetDialog() {
    form.reset();
    setClienteQuery("");
    setSelectedClienteId("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialog();
    }
  }

  function handleSelectCliente(cliente: ClienteOption) {
    setSelectedClienteId(cliente.id);
    setClienteQuery(cliente.nombre);
    setError(null);
  }

  function onSubmit(values: MascotaFormValues) {
    if (!selectedClienteId) {
      setError("Para crear un paciente debes seleccionar un cliente responsable.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createMascota(selectedClienteId, values);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Paciente creado correctamente.");
      setOpen(false);
      resetDialog();

      if (result.mascotaId) {
        router.push(`/mascotas/${result.mascotaId}?returnTo=${encodeURIComponent("/pacientes")}`);
        return;
      }

      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Nuevo paciente
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
          <DialogDescription>
            Para crear un paciente debes seleccionar un cliente responsable.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <section className="space-y-3 rounded-lg border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Label htmlFor="cliente-search">Cliente responsable</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Busca por nombre, teléfono o email.
                </p>
              </div>
              <Link href="/clientes/nuevo" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Crear cliente responsable
              </Link>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cliente-search"
                value={clienteQuery}
                onChange={(event) => setClienteQuery(event.target.value)}
                placeholder="Buscar responsable"
                className="pl-9"
              />
            </div>

            {selectedCliente ? (
              <div className="rounded-md bg-primary/5 px-3 py-2 text-sm">
                <p className="font-medium">Seleccionado: {selectedCliente.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {[selectedCliente.telefono, selectedCliente.email].filter(Boolean).join(" · ") || "Sin contacto registrado"}
                </p>
              </div>
            ) : null}

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {filteredClientes.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No hay clientes que coincidan. Crea primero el responsable.
                </div>
              ) : (
                filteredClientes.map((cliente) => {
                  const selected = selectedClienteId === cliente.id;

                  return (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => handleSelectCliente(cliente)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{cliente.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {[cliente.telefono, cliente.email].filter(Boolean).join(" · ") || "Sin contacto registrado"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paciente-nombre">Nombre del paciente</Label>
                <Input id="paciente-nombre" {...form.register("nombre")} />
                {form.formState.errors.nombre ? (
                  <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paciente-codigo">Código de paciente</Label>
                <Input
                  id="paciente-codigo"
                  placeholder="Ej. CAN-001, F-203, P00045"
                  {...form.register("codigo_text")}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Usa el código interno de la clínica.
                </p>
                {form.formState.errors.codigo_text ? (
                  <p className="text-sm text-destructive">{form.formState.errors.codigo_text.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="paciente-especie">Especie</Label>
                <Select
                  value={form.watch("especie") || ""}
                  onValueChange={(value) => form.setValue("especie", value ?? "", { shouldDirty: true })}
                >
                  <SelectTrigger id="paciente-especie" className="w-full">
                    <SelectValue placeholder="Selecciona especie" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((species) => (
                      <SelectItem key={species.value} value={species.value}>
                        {species.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paciente-raza">Raza</Label>
                <Input id="paciente-raza" placeholder="Ej. mestizo" {...form.register("raza")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paciente-nacimiento">Fecha de nacimiento</Label>
                <Input id="paciente-nacimiento" type="date" {...form.register("nacimiento")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paciente-alertas" className="font-semibold text-destructive">
                  Alertas críticas
                </Label>
                <Textarea
                  id="paciente-alertas"
                  rows={3}
                  placeholder="Ej. muerde, convulsiona, alergia a X"
                  className="resize-none text-sm"
                  {...form.register("alertas_criticas")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paciente-notas">Notas de manejo</Label>
                <Textarea
                  id="paciente-notas"
                  rows={3}
                  placeholder="Ej. se estresa, solo se deja cortar uñas con responsable"
                  className="resize-none text-sm"
                  {...form.register("notas_manejo")}
                />
              </div>
            </div>
          </section>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !selectedClienteId}>
              {pending ? "Creando..." : "Crear paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
