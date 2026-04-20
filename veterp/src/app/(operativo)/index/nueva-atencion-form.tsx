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

interface NuevaAtencionFormProps {
  clientes: { id: string; nombre: string; apellidos: string | null }[];
}

export function NuevaAtencionForm({ clientes }: NuevaAtencionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mascotas, setMascotas] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);

  const form = useForm<OrdenServicioInput>({
    resolver: zodResolver(ordenServicioSchema),
    defaultValues: {
      cliente_id: "",
      mascota_id: "",
    },
  });

  const selectedClienteId = form.watch("cliente_id");

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
        const currentMascota = form.getValues("mascota_id");
        if (currentMascota && !data.find((m) => m.id === currentMascota)) {
          form.setValue("mascota_id", "");
        }
      }
    }
    fetchMascotas();
  }, [selectedClienteId, form]);

  async function onSubmit(data: OrdenServicioInput) {
    setIsSubmitting(true);
    const { error } = await createOrdenServicio(data);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Orden de servicio creada exitosamente");
    form.reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva Atención
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Atención</DialogTitle>
          <DialogDescription>
            Crea una nueva orden de servicio para atender a una mascota.
          </DialogDescription>
        </DialogHeader>
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
                          No hay mascotas registradas
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Orden
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
