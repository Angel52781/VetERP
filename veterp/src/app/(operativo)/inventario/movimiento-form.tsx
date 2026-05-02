"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { movimientoInventarioSchema } from "@/lib/validators/ajustes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { registrarMovimientoInventario } from "./actions";

type FormValues = z.input<typeof movimientoInventarioSchema>;
type TipoMovimientoManual = "entrada" | "salida";

const MOTIVOS_POR_TIPO: Record<TipoMovimientoManual, { value: string; label: string }[]> = {
  entrada: [
    { value: "compra_proveedor", label: "Compra a proveedor" },
    { value: "devolucion", label: "Devolución" },
    { value: "correccion_positiva", label: "Corrección positiva" },
    { value: "otro", label: "Otro" },
  ],
  salida: [
    { value: "uso_clinico", label: "Uso clínico" },
    { value: "venta", label: "Venta" },
    { value: "merma_perdida", label: "Merma / pérdida" },
    { value: "correccion_negativa", label: "Corrección negativa" },
    { value: "otro", label: "Otro" },
  ],
};

interface Props {
  tipoMovimiento: TipoMovimientoManual;
  itemId: string;
  itemNombre: string;
  stockActual: number;
  almacenes: { id: string; nombre: string }[];
  onSuccess: () => void;
}

export function MovimientoForm({ tipoMovimiento, itemId, itemNombre, stockActual, almacenes, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const motivos = MOTIVOS_POR_TIPO[tipoMovimiento];
  const tipoLabel = tipoMovimiento === "entrada" ? "Entrada" : "Salida";

  const form = useForm<FormValues>({
    resolver: zodResolver(movimientoInventarioSchema),
    defaultValues: {
      item_id: itemId,
      almacen_id: almacenes[0]?.id ?? "",
      tipo: tipoMovimiento,
      qty: 1,
      motivo: motivos[0]?.value ?? "",
      notas: "",
      lote: "",
      fecha_vencimiento: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const res = await registrarMovimientoInventario({
      item_id: values.item_id,
      almacen_id: values.almacen_id,
      tipo: tipoMovimiento,
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
            <div className="space-y-2">
              <FormLabel>Tipo</FormLabel>
              <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3">
                <Badge className={tipoMovimiento === "entrada" ? "bg-emerald-100 text-emerald-800 border-none" : "bg-red-100 text-red-800 border-none"}>
                  {tipoLabel}
                </Badge>
              </div>
            </div>

            <FormField control={form.control} name="almacen_id" render={({ field }) => {
              const selectedAlmacen = almacenes.find((a) => a.id === field.value);
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
              );
            }} />

            <FormField control={form.control} name="qty" render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ej. 10"
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
                <Select onValueChange={field.onChange} value={field.value || motivos[0]?.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona motivo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {motivos.map((motivo) => (
                      <SelectItem key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FormControl><Textarea rows={2} placeholder="Factura, proveedor, detalle adicional..." {...field} value={field.value ?? ""} /></FormControl>
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
