"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createCita, getMascotasDeCliente, updateCita } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AREA_META, AREA_ORDER, normalizeCitaArea, type TipoCitaAgenda } from "./types";

import { format, addMinutes } from "date-fns";

interface CitaFormProps {
  clientes: { id: string; nombre: string }[];
  tiposCita: TipoCitaAgenda[];
  onSuccess?: () => void;
  initialDate?: string;
  initialClienteId?: string;
  citaId?: string;
  initialValues?: Partial<CitaInput>;
}

function toDateTimeLocalInput(value?: string, fallbackNow = false) {
  if (!value && fallbackNow) return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackNow ? format(new Date(), "yyyy-MM-dd'T'HH:mm") : "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function CitaForm({
  clientes,
  tiposCita,
  onSuccess,
  initialDate,
  initialClienteId,
  citaId,
  initialValues,
}: CitaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mascotas, setMascotas] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);

  const defaultStartDate = toDateTimeLocalInput(initialValues?.start_date || initialDate, true);
  // Default end date +30 min
  const defaultEndDate = initialValues?.end_date
    ? toDateTimeLocalInput(initialValues.end_date)
    : format(addMinutes(new Date(defaultStartDate), 30), "yyyy-MM-dd'T'HH:mm");
  const safeInitialClienteId =
    (initialValues?.cliente_id || initialClienteId) &&
    clientes.some((c) => c.id === (initialValues?.cliente_id || initialClienteId))
      ? (initialValues?.cliente_id || initialClienteId)!
      : "";

  const form = useForm<CitaInput>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      cliente_id: safeInitialClienteId,
      mascota_id: initialValues?.mascota_id || "",
      tipo_cita_id: initialValues?.tipo_cita_id || "",
      start_date: defaultStartDate,
      end_date: defaultEndDate,
    },
  });

  const selectedClienteId = form.watch("cliente_id");
  const selectedTipoCitaId = form.watch("tipo_cita_id");
  const selectedStartDate = form.watch("start_date");
  const tiposCitaOrdenados = useMemo(() => {
    return [...tiposCita].sort((a, b) => {
      const areaA = normalizeCitaArea(a.area);
      const areaB = normalizeCitaArea(b.area);
      const areaDiff = AREA_ORDER.indexOf(areaA) - AREA_ORDER.indexOf(areaB);
      return areaDiff || a.nombre.localeCompare(b.nombre, "es");
    });
  }, [tiposCita]);

  // Track if end_date was modified manually by the user
  const [isEndDateManual, setIsEndDateManual] = useState(false);

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
          form.resetField("mascota_id", { defaultValue: "" });
        }
      }
    }
    fetchMascotas();
  }, [selectedClienteId, form]);

  useEffect(() => {
    // Actualizar la fecha de fin basada en la duración del tipo de cita seleccionado
    // Solo si el usuario NO la ha modificado manualmente
    if (selectedTipoCitaId && selectedStartDate && !isEndDateManual) {
      const tipo = tiposCita.find((t) => t.id === selectedTipoCitaId);
      if (tipo) {
        const start = new Date(selectedStartDate);
        if (!isNaN(start.getTime())) {
          const end = addMinutes(start, tipo.duracion_min);
          form.setValue("end_date", format(end, "yyyy-MM-dd'T'HH:mm"));
        }
      }
    }
  }, [selectedTipoCitaId, selectedStartDate, tiposCita, form, isEndDateManual]);

  async function onSubmit(data: CitaInput) {
    setIsSubmitting(true);
    const { error } = citaId ? await updateCita(citaId, data) : await createCita(data);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(citaId ? "Cita actualizada exitosamente" : "Cita creada exitosamente");
    form.reset({
      cliente_id: safeInitialClienteId,
      mascota_id: initialValues?.mascota_id || "",
      tipo_cita_id: initialValues?.tipo_cita_id || "",
      start_date: defaultStartDate,
      end_date: defaultEndDate,
    });
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
              <FormLabel>Responsable</FormLabel>
              <Select 
                onValueChange={(val) => {
                  field.onChange(val || "");
                  form.resetField("mascota_id", { defaultValue: "" });
                }} 
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un responsable">
                      {field.value ? clientes.find(c => c.id === field.value)?.nombre : "Selecciona un responsable"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
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
            <FormItem className="space-y-3">
              <FormLabel>Paciente</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  {loadingMascotas ? (
                    <div className="col-span-2 flex items-center justify-center p-4 border rounded-md bg-muted/20">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Cargando...</span>
                    </div>
                  ) : !selectedClienteId ? (
                    <div className="col-span-2 p-4 border border-dashed rounded-md text-center bg-muted/10">
                      <p className="text-xs text-muted-foreground italic">Selecciona un responsable primero</p>
                    </div>
                  ) : mascotas.length === 0 ? (
                    <div className="col-span-2 p-4 border border-dashed rounded-md text-center bg-destructive/5 border-destructive/20">
                      <p className="text-xs text-destructive">El responsable no tiene pacientes</p>
                    </div>
                  ) : (
                    mascotas.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          field.onChange(m.id);
                          form.clearErrors("mascota_id");
                        }}
                        className={cn(
                          "relative flex flex-col items-start p-3 text-left border rounded-lg transition-all",
                          "hover:border-primary/50 hover:bg-accent/50",
                          field.value === m.id 
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                            : "border-input bg-background"
                        )}
                      >
                        <span className={cn(
                          "text-sm font-bold truncate w-full",
                          field.value === m.id ? "text-primary" : "text-foreground"
                        )}>
                          {m.nombre}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase mt-1">
                          Paciente
                        </span>
                        {field.value === m.id && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </FormControl>
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
              <Select 
                onValueChange={(val) => {
                  field.onChange(val || "");
                  form.trigger("tipo_cita_id");
                }} 
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de cita">
                      {field.value 
                        ? (() => {
                            const t = tiposCita.find(t => t.id === field.value);
                            return t ? `${t.nombre} (${t.duracion_min} min)` : "Selecciona un tipo de cita";
                          })()
                        : "Selecciona un tipo de cita"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposCitaOrdenados.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {AREA_META[normalizeCitaArea(t.area)].shortLabel} · {t.nombre} ({t.duracion_min} min)
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
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      setIsEndDateManual(true);
                    }}
                  />
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
