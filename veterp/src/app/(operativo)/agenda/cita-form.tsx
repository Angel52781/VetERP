"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { citaSchema, CitaInput } from "@/lib/validators/agenda";
import { createCita, getMascotasDeCliente } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { format, addMinutes } from "date-fns";

interface CitaFormProps {
  clientes: { id: string; nombre: string; apellidos: string | null }[];
  tiposCita: { id: string; nombre: string; duracion_min: number }[];
  onSuccess?: () => void;
  initialDate?: string;
}

export function CitaForm({
  clientes,
  tiposCita,
  onSuccess,
  initialDate,
}: CitaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mascotas, setMascotas] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);

  const defaultStartDate = initialDate || format(new Date(), "yyyy-MM-dd'T'HH:mm");
  // Default end date +30 min
  const defaultEndDate = format(addMinutes(new Date(defaultStartDate), 30), "yyyy-MM-dd'T'HH:mm");

  const form = useForm<CitaInput>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      cliente_id: "",
      mascota_id: "",
      tipo_cita_id: "",
      start_date: defaultStartDate,
      end_date: defaultEndDate,
    },
  });

  const selectedClienteId = form.watch("cliente_id");
  const selectedTipoCitaId = form.watch("tipo_cita_id");

  useEffect(() => {
    async function fetchMascotas() {
      if (!selectedClienteId) {
        setMascotas([]);
        return;
      }
      setLoadingMascotas(true);
      const { data, error } = await getMascotasDeCliente(selectedClienteId);
      setLoadingMascotas(false);
      
      if (error) {
        toast.error("Error al cargar mascotas");
        return;
      }
      if (data) {
        setMascotas(data);
        // Si el cliente no tiene la mascota seleccionada actual, resetear
        const currentMascota = form.getValues("mascota_id");
        if (currentMascota && !data.find((m) => m.id === currentMascota)) {
          form.setValue("mascota_id", "");
        }
      }
    }
    fetchMascotas();
  }, [selectedClienteId, form]);

  useEffect(() => {
    // Actualizar la fecha de fin basada en la duración del tipo de cita seleccionado
    if (selectedTipoCitaId) {
      const tipo = tiposCita.find((t) => t.id === selectedTipoCitaId);
      const start = form.getValues("start_date");
      if (tipo && start) {
        const startDate = new Date(start);
        if (!isNaN(startDate.getTime())) {
          const endDate = addMinutes(startDate, tipo.duracion_min);
          form.setValue("end_date", format(endDate, "yyyy-MM-dd'T'HH:mm"));
        }
      }
    }
  }, [selectedTipoCitaId, tiposCita, form]);

  async function onSubmit(data: CitaInput) {
    setIsSubmitting(true);
    const { error } = await createCita(data);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Cita creada exitosamente");
    form.reset();
    router.refresh();
    if (onSuccess) onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="cliente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.apellidos || ""}
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
          name="mascota_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mascota</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClienteId || loadingMascotas}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMascotas ? "Cargando..." : "Selecciona una mascota"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mascotas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                  {mascotas.length === 0 && !loadingMascotas && selectedClienteId && (
                    <SelectItem value="empty" disabled>
                      No hay mascotas
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_cita_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Cita</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de cita" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposCita.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre} ({t.duracion_min} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y Hora de Inicio</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y Hora de Fin</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cita
        </Button>
      </form>
    </Form>
  );
}
