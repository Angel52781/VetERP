"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity } from "lucide-react";
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
  createHospitalizacionControlSchema,
  type CreateHospitalizacionControlInput,
} from "@/lib/validators/hospitalizaciones";
import { createHospitalizacionControl } from "./actions";

type NuevoControlDialogProps = {
  hospitalizacionId: string;
  mascotaId: string;
  pacienteNombre: string;
};

function numberFieldValue(value: number | undefined) {
  return value ?? "";
}

export function NuevoControlDialog({
  hospitalizacionId,
  mascotaId,
  pacienteNombre,
}: NuevoControlDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateHospitalizacionControlInput>({
    resolver: zodResolver(createHospitalizacionControlSchema),
    defaultValues: {
      hospitalizacion_id: hospitalizacionId,
      mascota_id: mascotaId,
      temperatura_num: undefined,
      frecuencia_cardiaca_num: undefined,
      frecuencia_respiratoria_num: undefined,
      peso_num: undefined,
      deshidratacion_pct: undefined,
      mucosas_text: "",
      tlc_text: "",
      comio_bool: false,
      orino_bool: false,
      defeco_bool: false,
      observaciones_text: "",
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  function onSubmit(values: CreateHospitalizacionControlInput) {
    startTransition(async () => {
      const result = await createHospitalizacionControl(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Control registrado");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Registrar control
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Control de hospitalización
          </DialogTitle>
          <DialogDescription>{pacienteNombre}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="temperatura_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        value={numberFieldValue(field.value)}
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
                        value={numberFieldValue(field.value)}
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
                        value={numberFieldValue(field.value)}
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
                name="peso_num"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={numberFieldValue(field.value)}
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

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="deshidratacion_pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deshidratación (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={numberFieldValue(field.value)}
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
                name="mucosas_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mucosas</FormLabel>
                    <FormControl>
                      <Input placeholder="Rosadas, pálidas..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tlc_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TLC</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. 2 seg" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 rounded-lg border p-3">
              <FormField
                control={form.control}
                name="comio_bool"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Comió</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orino_bool"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Orinó</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defeco_bool"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Defecó</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observaciones_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Evolución, conducta, respuesta al manejo..."
                      className="min-h-24 resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Guardando..." : "Guardar control"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
