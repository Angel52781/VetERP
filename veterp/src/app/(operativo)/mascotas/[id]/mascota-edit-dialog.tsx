"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { updateMascota } from "@/app/(operativo)/clientes/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { SPECIES_OPTIONS } from "@/lib/patient-labels";
import { mascotaSchema, type MascotaFormValues } from "@/lib/validators/clientes";

type MascotaEditDialogProps = {
  mascota: {
    id: string;
    nombre: string;
    especie: string | null;
    raza: string | null;
    nacimiento: string | null;
  };
};

export function MascotaEditDialog({ mascota }: MascotaEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MascotaFormValues>({
    resolver: zodResolver(mascotaSchema),
    defaultValues: {
      nombre: mascota.nombre,
      especie: mascota.especie ?? "",
      raza: mascota.raza ?? "",
      nacimiento: mascota.nacimiento ?? "",
    },
  });

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setError(null);
      form.reset({
        nombre: mascota.nombre,
        especie: mascota.especie ?? "",
        raza: mascota.raza ?? "",
        nacimiento: mascota.nacimiento ?? "",
      });
    }
  }

  function onSubmit(values: MascotaFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await updateMascota(mascota.id, values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil className="mr-2 h-4 w-4" />
        Editar paciente
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar paciente</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="edit-mascota-nombre">Nombre</Label>
            <Input id="edit-mascota-nombre" {...form.register("nombre")} />
            {form.formState.errors.nombre ? (
              <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-mascota-especie">Especie</Label>
              <Select
                value={form.watch("especie") || ""}
                onValueChange={(value) => form.setValue("especie", value ?? "", { shouldDirty: true })}
              >
                <SelectTrigger id="edit-mascota-especie" className="w-full">
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
              <Label htmlFor="edit-mascota-raza">Raza</Label>
              <Input id="edit-mascota-raza" {...form.register("raza")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-mascota-nacimiento">Nacimiento</Label>
            <Input id="edit-mascota-nacimiento" type="date" {...form.register("nacimiento")} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
