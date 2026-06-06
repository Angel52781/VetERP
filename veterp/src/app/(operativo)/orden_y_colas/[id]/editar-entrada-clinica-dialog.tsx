"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
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
  editarEntradaClinicaSchema,
  type EditarEntradaClinicaInput,
} from "@/lib/validators/atencion";
import { updateEntradaClinicaConAuditoria } from "./actions";

export type EntradaClinicaEditable = {
  id: string;
  tipo_text?: string | null;
  texto_text?: string | null;
  motivo_consulta_text?: string | null;
  peso_kg_num?: number | string | null;
  temperatura_c_num?: number | string | null;
  frecuencia_cardiaca_num?: number | null;
  frecuencia_respiratoria_num?: number | null;
  observaciones_text?: string | null;
  diagnostico_text?: string | null;
  anamnesis_text?: string | null;
  plan_tratamiento_text?: string | null;
};

type EditarEntradaClinicaDialogProps = {
  entrada: EntradaClinicaEditable;
};

function numberValue(value: number | undefined) {
  return value ?? "";
}

function toNumberOrUndefined(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function EditarEntradaClinicaDialog({ entrada }: EditarEntradaClinicaDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const resolver = zodResolver(editarEntradaClinicaSchema) as Resolver<EditarEntradaClinicaInput>;
  const form = useForm<EditarEntradaClinicaInput>({
    resolver,
    defaultValues: {
      id: entrada.id,
      tipo_text: entrada.tipo_text ?? "Evolución u observación",
      texto_text: entrada.texto_text ?? "",
      motivo_consulta_text: entrada.motivo_consulta_text ?? "",
      peso_kg_num: toNumberOrUndefined(entrada.peso_kg_num),
      temperatura_c_num: toNumberOrUndefined(entrada.temperatura_c_num),
      frecuencia_cardiaca_num: toNumberOrUndefined(entrada.frecuencia_cardiaca_num),
      frecuencia_respiratoria_num: toNumberOrUndefined(entrada.frecuencia_respiratoria_num),
      observaciones_text: entrada.observaciones_text ?? "",
      diagnostico_text: entrada.diagnostico_text ?? "",
      anamnesis_text: entrada.anamnesis_text ?? "",
      plan_tratamiento_text: entrada.plan_tratamiento_text ?? "",
      motivo_edicion_text: "",
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  function onSubmit(values: EditarEntradaClinicaInput) {
    startTransition(async () => {
      const result = await updateEntradaClinicaConAuditoria(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Registro actualizado con auditoría");
      setOpen(false);
      form.reset({ ...values, motivo_edicion_text: "" });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Pencil className="mr-2 h-3.5 w-3.5" />
        Editar con auditoría
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Editar con auditoría
          </DialogTitle>
          <DialogDescription>
            Corrige un registro guardado dejando historial de cambios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Esta corrección guardará motivo, usuario, fecha y cambios realizados.
            </div>

            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="motivo_consulta_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de consulta</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="peso_kg_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={999}
                        value={numberValue(field.value)}
                        onChange={(event) =>
                          field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperatura_c_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temp (C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={60}
                        value={numberValue(field.value)}
                        onChange={(event) =>
                          field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frecuencia_cardiaca_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={numberValue(field.value)}
                        onChange={(event) =>
                          field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frecuencia_respiratoria_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FR</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        value={numberValue(field.value)}
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
              name="anamnesis_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anamnesis</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-20 resize-none" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Examen fisico / observaciones</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-20 resize-none" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostico_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnostico</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-16 resize-none" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan_tratamiento_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan de tratamiento</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-20 resize-none" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="texto_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota libre</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-20 resize-none" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo_edicion_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del cambio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej. Corrección de un signo vital registrado incorrectamente"
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios con auditoría"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
