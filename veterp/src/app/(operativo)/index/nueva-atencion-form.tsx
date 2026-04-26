"use client";

import { useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ordenServicioSchema, OrdenServicioInput } from "@/lib/validators/atencion";
import { createOrdenServicio } from "./actions";
import { getMascotasDeCliente } from "../agenda/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NuevaAtencionFormProps {
  clientes: { id: string; nombre: string }[];
}

export function NuevaAtencionForm({ clientes }: NuevaAtencionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mascotas, setMascotas] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);

  const form = useForm<OrdenServicioInput>({
    resolver: zodResolver(ordenServicioSchema),
    mode: "onSubmit", // Solo validar al enviar para evitar ruidos de UX
    defaultValues: {
      cliente_id: "",
      mascota_id: "",
    },
  });

  const selectedClienteId = form.watch("cliente_id");

  // Función atómica para cambiar cliente y limpiar estado
  const handleClienteChange = useCallback(async (clienteId: string | null) => {
    const id = clienteId || "";
    // 1. Actualizar RHF de forma silenciosa
    form.setValue("cliente_id", id, { shouldValidate: false });
    form.setValue("mascota_id", "", { shouldValidate: false, shouldDirty: false, shouldTouch: false });
    form.clearErrors(); // Limpieza total de errores preventivos

    // 2. Cargar mascotas
    if (!id) {
      setMascotas([]);
      return;
    }

    setLoadingMascotas(true);
    const { data, error } = await getMascotasDeCliente(id);
    setLoadingMascotas(false);

    if (error) {
      toast.error("Error al cargar mascotas");
      setMascotas([]);
      return;
    }

    if (data) {
      setMascotas(data);
    }
  }, [form]);

  async function onSubmit(data: OrdenServicioInput) {
    setIsSubmitting(true);
    const { error } = await createOrdenServicio(data);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Atención abierta correctamente");
    form.reset();
    setMascotas([]);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        form.reset();
        setMascotas([]);
      }
      setOpen(val);
    }}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva Atención
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Atención</DialogTitle>
          <DialogDescription>
            Selecciona un cliente y su mascota para iniciar la atención clínica.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {/* Campo Cliente */}
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dueño / Cliente</FormLabel>
                  <Select 
                    onValueChange={handleClienteChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Busca o selecciona un cliente">
                          {field.value ? clientes.find(c => c.id === field.value)?.nombre : "Busca o selecciona un cliente"}
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

            {/* Campo Mascota (UI Robusta de Botones) */}
            <FormField
              control={form.control}
              name="mascota_id"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Paciente / Mascota</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {loadingMascotas ? (
                        <div className="col-span-2 flex items-center justify-center p-6 border rounded-lg bg-muted/20">
                          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                          <span className="text-sm font-medium">Cargando...</span>
                        </div>
                      ) : !selectedClienteId ? (
                        <div className="col-span-2 p-6 border border-dashed rounded-lg text-center bg-muted/5">
                          <p className="text-sm text-muted-foreground">Selecciona un cliente para ver sus mascotas</p>
                        </div>
                      ) : mascotas.length === 0 ? (
                        <div className="col-span-2 p-6 border border-dashed rounded-lg text-center bg-destructive/5 border-destructive/10">
                          <p className="text-sm text-destructive font-medium">Sin mascotas registradas</p>
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
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                              Ficha Clínica
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

            <div className="pt-4 border-t">
              <Button type="submit" disabled={isSubmitting || !selectedClienteId} className="w-full h-11 font-bold shadow-md">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Iniciar Atención Médica"
                )}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
