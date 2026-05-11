"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  altaHospitalizacionSchema,
  type AltaHospitalizacionInput,
} from "@/lib/validators/hospitalizaciones";
import { darAltaHospitalizacion } from "./actions";

type AltaHospitalizacionDialogProps = {
  hospitalizacionId: string;
  pacienteNombre: string;
};

export function AltaHospitalizacionDialog({
  hospitalizacionId,
  pacienteNombre,
}: AltaHospitalizacionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<AltaHospitalizacionInput>({
    resolver: zodResolver(altaHospitalizacionSchema),
    defaultValues: {
      id: hospitalizacionId,
      alta_notas_text: "",
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  function onSubmit(values: AltaHospitalizacionInput) {
    startTransition(async () => {
      const result = await darAltaHospitalizacion(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Alta registrada");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>Dar alta</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Dar alta
          </DialogTitle>
          <DialogDescription>
            Cierra el internamiento activo de {pacienteNombre}. No genera cobro automático.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="alta_notas_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de alta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Indicaciones, estado final, recomendaciones..."
                      className="min-h-28 resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Registrando..." : "Confirmar alta"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
