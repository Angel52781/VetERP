"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { createMascota } from "../actions";

export default function MascotaForm({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MascotaFormValues>({
    resolver: zodResolver(mascotaSchema),
    defaultValues: { nombre: "", especie: "", raza: "", nacimiento: "" },
  });

  function onSubmit(values: MascotaFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await createMascota(clienteId, values);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo paciente</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...form.register("nombre")} />
            {form.formState.errors.nombre ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="especie">Especie</Label>
              <Select
                value={form.watch("especie") || ""}
                onValueChange={(value) => form.setValue("especie", value ?? "", { shouldDirty: true })}
              >
                <SelectTrigger id="especie" className="w-full">
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
              <Label htmlFor="raza">Raza</Label>
              <Input id="raza" placeholder="Ej. mestizo, labrador, siames" {...form.register("raza")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nacimiento">Nacimiento</Label>
            <Input id="nacimiento" type="date" {...form.register("nacimiento")} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={pending}>
            Crear paciente
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

