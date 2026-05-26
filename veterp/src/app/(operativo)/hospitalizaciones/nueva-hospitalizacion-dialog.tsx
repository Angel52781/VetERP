"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BedDouble, Phone, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
import {
  createHospitalizacionSchema,
  type CreateHospitalizacionInput,
} from "@/lib/validators/hospitalizaciones";
import { createHospitalizacion } from "./actions";

export type HospitalizacionPacienteOption = {
  id: string;
  nombre: string;
  codigo_text: string | null;
  especie: string | null;
  raza: string | null;
  cliente_id: string;
  clientes: {
    id: string;
    nombre: string;
    telefono: string | null;
  } | null;
};

type NuevaHospitalizacionDialogProps = {
  pacientes: HospitalizacionPacienteOption[];
};

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function NuevaHospitalizacionDialog({ pacientes }: NuevaHospitalizacionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateHospitalizacionInput>({
    resolver: zodResolver(createHospitalizacionSchema),
    defaultValues: {
      mascota_id: "",
      cliente_id: "",
      medico_tratante_text: "",
      motivo_text: "",
      diagnostico_presuntivo_text: "",
    },
  });

  const selectedMascotaId = form.watch("mascota_id");
  const selectedPaciente = useMemo(
    () => pacientes.find((paciente) => paciente.id === selectedMascotaId),
    [pacientes, selectedMascotaId],
  );
  const filteredPacientes = useMemo(() => {
    const query = normalizeSearch(patientQuery.trim());
    if (!query) return pacientes.slice(0, 20);

    return pacientes
      .filter((paciente) => {
        const searchable = [
          paciente.nombre,
          paciente.codigo_text,
          paciente.clientes?.nombre,
          paciente.clientes?.telefono,
          paciente.especie,
          formatSpeciesLabel(paciente.especie),
          paciente.raza,
          formatBreedLabel(paciente.raza),
        ]
          .map(normalizeSearch)
          .join(" ");

        return searchable.includes(query);
      })
      .slice(0, 30);
  }, [pacientes, patientQuery]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
      setPatientQuery("");
      setActionError(null);
    }
  }

  function handlePacienteChange(mascotaId: string) {
    const paciente = pacientes.find((item) => item.id === mascotaId);
    form.setValue("mascota_id", mascotaId, { shouldValidate: true });
    form.setValue("cliente_id", paciente?.cliente_id ?? "", { shouldValidate: true });
    form.clearErrors(["mascota_id", "cliente_id"]);
    setActionError(null);
    setPatientQuery(paciente?.nombre ?? "");
  }

  function onSubmit(values: CreateHospitalizacionInput) {
    setActionError(null);
    startTransition(async () => {
      const result = await createHospitalizacion(values);
      if (result.error) {
        setActionError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Internamiento creado");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
        <Plus className="mr-2 h-4 w-4" />
        Nuevo internamiento
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            Nuevo internamiento
          </DialogTitle>
          <DialogDescription>
            Registra un paciente internado sin crear cobro ni movimientos de inventario.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mascota_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <FormControl>
                    <div className="space-y-3 rounded-lg border p-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={patientQuery}
                          onChange={(event) => setPatientQuery(event.target.value)}
                          placeholder="Buscar por código, paciente, responsable, especie o raza"
                          className="pl-9"
                        />
                      </div>

                      {selectedPaciente && (
                        <div className="rounded-md bg-primary/5 px-3 py-2 text-sm">
                          <p className="font-medium">
                            Seleccionado: {selectedPaciente.nombre}
                            {selectedPaciente.codigo_text?.trim() ? ` #${selectedPaciente.codigo_text}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedPaciente.clientes?.nombre ?? "Responsable no registrado"}
                            {selectedPaciente.clientes?.telefono ? ` · ${selectedPaciente.clientes.telefono}` : ""}
                          </p>
                        </div>
                      )}

                      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                        {filteredPacientes.length === 0 ? (
                          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                            No hay pacientes que coincidan con la búsqueda.
                          </div>
                        ) : (
                          filteredPacientes.map((paciente) => {
                            const selected = field.value === paciente.id;
                            return (
                              <button
                                key={paciente.id}
                                type="button"
                                onClick={() => handlePacienteChange(paciente.id)}
                                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                                  selected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="truncate text-sm font-semibold">{paciente.nombre}</p>
                                      {paciente.codigo_text?.trim() ? (
                                        <span className="rounded-full border px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                                          #{paciente.codigo_text}
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {formatSpeciesLabel(paciente.especie)} / {formatBreedLabel(paciente.raza)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Responsable: {paciente.clientes?.nombre ?? "No registrado"}
                                    </p>
                                  </div>
                                  {paciente.clientes?.telefono && (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      {paciente.clientes.telefono}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medico_tratante_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Médico tratante</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del médico responsable" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de internamiento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej. Observación postoperatoria, deshidratación, monitoreo..."
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostico_presuntivo_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico presuntivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Diagnóstico o sospecha inicial"
                      className="min-h-20 resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={pending || pacientes.length === 0}>
              {pending ? "Guardando..." : "Crear internamiento"}
            </Button>
            {actionError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {actionError}
              </p>
            ) : null}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
