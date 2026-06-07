"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, PlusCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { crearRegistroPrevio } from "./actions";
import { 
  createRegistroPrevioSchema, 
  type CreateRegistroPrevioInput 
} from "@/lib/validators/registros-previos";

interface RegistroPrevioDialogProps {
  mascotaId: string;
  mascotaNacimiento?: string;
}

export function RegistroPrevioDialog({ mascotaId, mascotaNacimiento }: RegistroPrevioDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRegistroPrevioInput>({
    resolver: zodResolver(createRegistroPrevioSchema) as any,
    defaultValues: {
      mascota_id: mascotaId,
      fecha_historica_date: format(new Date(), "yyyy-MM-dd"),
      fecha_aproximada_bool: false,
      titulo_text: "",
      descripcion_text: "",
      fuente_text: "",
    },
  });

  const watchFechaAproximada = watch("fecha_aproximada_bool");

  const onSubmit = async (data: CreateRegistroPrevioInput) => {
    setIsSubmitting(true);
    try {
      const { error } = await crearRegistroPrevio(data);
      if (error) {
        toast.error("Error al guardar", {
          description: error,
        });
      } else {
        toast.success("Éxito", {
          description: "Antecedente clínico guardado correctamente.",
        });
        reset();
        setOpen(false);
        router.refresh();
      }
    } catch (e: any) {
      toast.error("Error al guardar", {
        description: "Ocurrió un error inesperado. Intente nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Agregar antecedente clínico
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Nuevo antecedente clínico
          </DialogTitle>
          <DialogDescription>
            Agregue historia clínica antigua desde papel, cartillas, laboratorios u otros sistemas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_historica_date">Fecha del antecedente</Label>
                <Input
                  id="fecha_historica_date"
                  type="date"
                  {...register("fecha_historica_date")}
                  min={mascotaNacimiento}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
                {errors.fecha_historica_date && (
                  <p className="text-xs text-red-500">{errors.fecha_historica_date.message}</p>
                )}
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="fecha_aproximada_bool"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={watchFechaAproximada}
                    onChange={(e) => setValue("fecha_aproximada_bool", e.target.checked)}
                  />
                  <Label htmlFor="fecha_aproximada_bool" className="text-sm font-normal cursor-pointer">
                    La fecha es aproximada
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo_text">Título / Resumen</Label>
              <Input
                id="titulo_text"
                placeholder="Ej: Cirugía ortopédica, Vacunación previa..."
                {...register("titulo_text")}
              />
              {errors.titulo_text && (
                <p className="text-xs text-red-500">{errors.titulo_text.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion_text">Detalle clínico</Label>
              <Textarea
                id="descripcion_text"
                placeholder="Describa el historial, diagnóstico o hallazgos..."
                rows={4}
                {...register("descripcion_text")}
              />
              {errors.descripcion_text && (
                <p className="text-xs text-red-500">{errors.descripcion_text.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuente_text">Fuente de la información (Opcional)</Label>
              <Input
                id="fuente_text"
                placeholder="Ej: Cartilla física, Clínica externa, Relato del dueño..."
                {...register("fuente_text")}
              />
              {errors.fuente_text && (
                <p className="text-xs text-red-500">{errors.fuente_text.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-md bg-amber-50 p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Esta herramienta es para transcribir historia clínica antigua. <strong>No modifica inventario ni genera cobros.</strong> Para una atención médica en tiempo real, use &quot;Nueva atención&quot;.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar antecedente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
