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
import { tipoCitaSchema, TipoCitaInput } from "@/lib/validators/agenda";
import { createTipoCita } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AREA_META, AREA_ORDER } from "./types";

interface TipoCitaFormProps {
  onSuccess?: () => void;
}

export function TipoCitaForm({ onSuccess }: TipoCitaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TipoCitaInput>({
    resolver: zodResolver(tipoCitaSchema),
    defaultValues: {
      nombre: "",
      duracion_min: 30,
      color: "#3b82f6",
      area: "clinica",
      is_disabled: false,
    },
  });

  async function onSubmit(data: TipoCitaInput) {
    setIsSubmitting(true);
    const { error } = await createTipoCita(data);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Tipo de cita creado exitosamente");
    form.reset();
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
                <Input placeholder="Consulta General" {...field} />
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
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
                  <Input type="color" className="w-16 p-1 h-10" {...field} />
                  <Input type="text" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Tipo de Cita
        </Button>
      </form>
    </Form>
  );
}
