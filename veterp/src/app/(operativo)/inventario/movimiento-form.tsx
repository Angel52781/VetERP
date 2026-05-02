"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { movimientoInventarioSchema, TIPOS_MOVIMIENTO } from "@/lib/validators/ajustes";
import { z } from "zod";

type FormValues = z.input<typeof movimientoInventarioSchema>;
import { registrarMovimientoInventario } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const TIPO_LABELS: Record<string, string> = {
  entrada: "Entrada de stock",
  salida: "Salida de stock",
  ajuste_manual: "Ajuste manual",
  inventario_inicial: "Inventario inicial",
  merma: "Merma / Pérdida",
  correccion: "Corrección",
  compra: "Compra a proveedor",
};

const TIPOS_UI = ["entrada", "salida", "ajuste_manual", "inventario_inicial", "merma", "correccion", "compra"] as const;

interface Props {
  itemId: string;
  itemNombre: string;
  stockActual: number;
  almacenes: { id: string; nombre: string }[];
  onSuccess: () => void;
}

export function MovimientoForm({ itemId, itemNombre, stockActual, almacenes, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(movimientoInventarioSchema),
    defaultValues: {
      item_id: itemId,
      almacen_id: almacenes[0]?.id ?? "",
      tipo: "entrada",
      qty: 1,
      motivo: "",
      notas: "",
      lote: "",
      fecha_vencimiento: "",
    },
  });

  const tipoActual = form.watch("tipo");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const res = await registrarMovimientoInventario({
      item_id: values.item_id,
      almacen_id: values.almacen_id,
      tipo: values.tipo,
      qty: Number(values.qty),
      lote: values.lote || null,
      fecha_vencimiento: values.fecha_vencimiento || null,
      notas: values.notas || null,
      motivo: values.motivo || undefined,
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Movimiento registrado correctamente");
    router.refresh();
    onSuccess();
  }

  if (almacenes.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-destructive">
        Debes crear al menos un almacén en <strong>Ajustes → Almacenes</strong> antes de registrar movimientos.
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar movimiento</DialogTitle>
        <DialogDescription>
          <span className="font-medium">{itemNombre}</span> — Stock actual: <span className="font-bold">{stockActual}</span>
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {TIPOS_UI.map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_LABELS[t] ?? t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="almacen_id" render={({ field }) => {
              const selectedAlmacen = almacenes.find(a => a.id === field.value);
              const almacenLabel = selectedAlmacen ? selectedAlmacen.nombre : "Almacén no encontrado";
              return (
              <FormItem>
                <FormLabel>Almacén *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger className={!selectedAlmacen ? "text-muted-foreground" : ""}>
                      <span className="line-clamp-1 flex-1 text-left">{almacenLabel}</span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {almacenes.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}} />

            <FormField control={form.control} name="qty" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cantidad *
                  {tipoActual === "ajuste_manual" && <span className="text-xs text-muted-foreground ml-1">(+/-)</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={tipoActual === "ajuste_manual" ? "Ej. -3 o 5" : "Ej. 10"}
                    {...field}
                    value={field.value as number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="motivo" render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <FormControl><Input placeholder="Ej. Compra factura #123" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="lote" render={({ field }) => (
              <FormItem>
                <FormLabel>Lote (opcional)</FormLabel>
                <FormControl><Input placeholder="Ej. LOT-2024-001" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="fecha_vencimiento" render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimiento (opcional)</FormLabel>
                <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notas" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Notas</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Observaciones adicionales..." {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar movimiento"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
