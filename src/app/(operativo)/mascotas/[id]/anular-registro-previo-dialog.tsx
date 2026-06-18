"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Ban } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { anularRegistroPrevio } from "./actions";
import { 
  anularRegistroPrevioSchema, 
  type AnularRegistroPrevioInput 
} from "@/lib/validators/registros-previos";

interface AnularRegistroPrevioDialogProps {
  registroId: string;
  mascotaId: string;
  titulo: string;
}

export function AnularRegistroPrevioDialog({ registroId, mascotaId, titulo }: AnularRegistroPrevioDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnularRegistroPrevioInput>({
    resolver: zodResolver(anularRegistroPrevioSchema) as any,
    defaultValues: {
      id: registroId,
      mascota_id: mascotaId,
      motivo_anulacion_text: "",
    },
  });

  const onSubmit = async (data: AnularRegistroPrevioInput) => {
    setIsSubmitting(true);
    try {
      const { error } = await anularRegistroPrevio(data);
      if (error) {
        toast.error("Error al anular", {
          description: error,
        });
      } else {
        toast.success("Éxito", {
          description: "Antecedente anulado correctamente.",
        });
        reset();
        setOpen(false);
        router.refresh();
      }
    } catch (e: any) {
      toast.error("Error al anular", {
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
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/50 dark:hover:bg-red-950/30">
            <Ban className="mr-2 h-3.5 w-3.5" />
            Anular antecedente
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Anular antecedente
          </DialogTitle>
          <DialogDescription>
            Va a anular el registro <strong>{titulo}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-md bg-amber-50 p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Esta acción no elimina físicamente el registro, pero lo marca como anulado permanentemente en la historia clínica. Es irreversible.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo_anulacion_text">Motivo de anulación</Label>
            <Textarea
              id="motivo_anulacion_text"
              placeholder="Especifique por qué se anula este antecedente (mínimo 5 caracteres)..."
              rows={3}
              {...register("motivo_anulacion_text")}
            />
            {errors.motivo_anulacion_text && (
              <p className="text-xs text-red-500">{errors.motivo_anulacion_text.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Anulando..." : "Anular antecedente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
