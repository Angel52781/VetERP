"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
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
  updateTratamientoHospitalizacionSchema,
  type UpdateTratamientoHospitalizacionInput,
} from "@/lib/validators/hospitalizaciones";
import { updateTratamientoHospitalizacion } from "./actions";

type TratamientoEditable = {
  id: string;
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
};

type EditarTratamientoDialogProps = {
  tratamiento: TratamientoEditable;
};

function ordenFieldValue(value: number | undefined) {
  return value ?? "";
}

export function EditarTratamientoDialog({ tratamiento }: EditarTratamientoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<UpdateTratamientoHospitalizacionInput>({
    resolver: zodResolver(updateTratamientoHospitalizacionSchema) as any,
    defaultValues: {
      id: tratamiento.id,
      hospitalizacion_id: tratamiento.hospitalizacion_id,
      mascota_id: tratamiento.mascota_id,
      nombre_text: tratamiento.nombre_text,
      dosis_text: tratamiento.dosis_text ?? "",
      via_text: tratamiento.via_text ?? "",
      frecuencia_text: tratamiento.frecuencia_text ?? "",
      indicaciones_text: tratamiento.indicaciones_text ?? "",
      responsable_text: tratamiento.responsable_text ?? "",
      notas_text: tratamiento.notas_text ?? "",
      orden_num: tratamiento.orden_num ?? undefined,
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  function onSubmit(values: UpdateTratamientoHospitalizacionInput) {
    startTransition(async () => {
      const result = await updateTratamientoHospitalizacion(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Tratamiento actualizado");
      setOpen(false);
      form.reset(values);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Pencil className="mr-2 h-3.5 w-3.5" />
        Editar
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Editar tratamiento
          </DialogTitle>
          <DialogDescription>
            Ajusta la ficha operativa sin generar cobros ni movimientos de inventario.
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
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
