"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pill, Plus } from "lucide-react";
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
import {
  createTratamientoHospitalizacionSchema,
  type CreateTratamientoHospitalizacionInput,
} from "@/lib/validators/hospitalizaciones";
import { createTratamientoHospitalizacion } from "./actions";

type NuevoTratamientoDialogProps = {
  hospitalizacionId: string;
  mascotaId: string;
  pacienteNombre: string;
};

function ordenFieldValue(value: number | undefined) {
  return value ?? "";
}

export function NuevoTratamientoDialog({
  hospitalizacionId,
  mascotaId,
  pacienteNombre,
}: NuevoTratamientoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateTratamientoHospitalizacionInput>({
    resolver: zodResolver(createTratamientoHospitalizacionSchema) as any,
    defaultValues: {
      hospitalizacion_id: hospitalizacionId,
      mascota_id: mascotaId,
      nombre_text: "",
      dosis_text: "",
      via_text: "",
      frecuencia_text: "",
      indicaciones_text: "",
      responsable_text: "",
      notas_text: "",
      orden_num: undefined,
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  function onSubmit(values: CreateTratamientoHospitalizacionInput) {
    startTransition(async () => {
      const result = await createTratamientoHospitalizacion(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Tratamiento agregado");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-2 h-4 w-4" />
        Agregar tratamiento
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Nuevo tratamiento
          </DialogTitle>
          <DialogDescription>
            {pacienteNombre}. No genera cobro ni movimientos de inventario.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tratamiento</FormLabel>
                  <FormControl>
                    <Input placeholder="Farmaco, terapia o indicacion operativa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="dosis_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosis</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. 20 mg" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="via_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Via</FormLabel>
                    <FormControl>
                      <Input placeholder="VO, IV, SC..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frecuencia_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia</FormLabel>
                    <FormControl>
                      <Input placeholder="Cada 8 horas" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <FormField
                control={form.control}
                name="responsable_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <FormControl>
                      <Input placeholder="Medico, tecnico o area responsable" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orden_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={999}
                        value={ordenFieldValue(field.value)}
                        onChange={(event) =>
                          field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="indicaciones_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Preparacion, cuidados, monitoreo o instrucciones clinicas"
                      className="min-h-24 resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas internas del tratamiento"
                      className="min-h-20 resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Guardando..." : "Guardar tratamiento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
