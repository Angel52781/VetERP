"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        toast.error(result.error);
        return;
      }
      toast.success("Mascota creada exitosamente");
      form.reset();
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nueva mascota</CardTitle>
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
              <Input id="especie" {...form.register("especie")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raza">Raza</Label>
              <Input id="raza" {...form.register("raza")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nacimiento">Nacimiento</Label>
            <Input id="nacimiento" type="date" {...form.register("nacimiento")} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={pending}>
            Crear mascota
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

