"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tipoCitaSchema, tipoCitaUpdateSchema, type TipoCitaInput, type TipoCitaUpdateInput } from "@/lib/validators/agenda";
import { createTipoCita, updateTipoCita } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AREA_META, AREA_ORDER, normalizeCitaArea, type CitaArea, type TipoCitaAgenda } from "./types";

interface TipoCitaFormProps {
  onSuccess?: () => void;
  tipoCita?: TipoCitaAgenda;
}

type TipoCitaFormValues = {
  nombre: string;
  duracion_min: number;
  color?: string | null;
  area: CitaArea;
};

export function TipoCitaForm({ onSuccess, tipoCita }: TipoCitaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(tipoCita?.id);

  const form = useForm<TipoCitaFormValues>({
    resolver: zodResolver(isEditing ? tipoCitaUpdateSchema : tipoCitaSchema),
    defaultValues: {
      nombre: tipoCita?.nombre ?? "",
      duracion_min: tipoCita?.duracion_min ?? 30,
      color: tipoCita?.color ?? "#3b82f6",
      area: normalizeCitaArea(tipoCita?.area),
    },
  });

  async function onSubmit(data: TipoCitaFormValues) {
    setIsSubmitting(true);
    const result = isEditing && tipoCita?.id
      ? await updateTipoCita(tipoCita.id, data as TipoCitaUpdateInput)
      : await createTipoCita(data as TipoCitaInput);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Tipo de cita actualizado." : "Tipo de cita creado exitosamente.");
    if (!isEditing) form.reset();
    router.refresh();
    if (onSuccess) onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Consulta general" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Área operativa</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AREA_ORDER.map((area) => (
                    <SelectItem key={area} value={area}>
                      {AREA_META[area].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duracion_min"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración (minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input type="color" className="h-10 w-16 p-1" value={field.value ?? "#3b82f6"} onChange={field.onChange} />
                  <Input type="text" value={field.value ?? ""} onChange={field.onChange} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar cambios" : "Guardar tipo de cita"}
        </Button>
      </form>
    </Form>
  );
}