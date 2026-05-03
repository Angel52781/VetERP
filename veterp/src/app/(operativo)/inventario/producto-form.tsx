"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { itemInventarioSchema, UNIDADES_VALIDAS } from "@/lib/validators/ajustes";
import { z } from "zod";

type FormValues = z.input<typeof itemInventarioSchema>;
import { crearProducto, actualizarProducto } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  initialData?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    kind: "producto" | "servicio";
    sku: string | null;
    unidad: string;
    precio_inc: number;
    costo_referencial: number | null;
    stock_minimo: number;
    is_disabled: boolean;
    proveedor_id: string | null;
    categoria_id: string | null;
  };
  proveedores: { id: string; nombre: string }[];
  categorias: { id: string; nombre: string }[];
  almacenes: { id: string; nombre: string }[];
  onSuccess: () => void;
}

export function ProductoForm({ initialData, proveedores, categorias, almacenes, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(itemInventarioSchema),
    defaultValues: {
      nombre: initialData?.nombre ?? "",
      descripcion: initialData?.descripcion ?? "",
      kind: initialData?.kind ?? "producto",
      sku: initialData?.sku ?? "",
      unidad: (initialData?.unidad as FormValues["unidad"]) ?? "unidad",
      precio_inc: initialData?.precio_inc ?? 0,
      costo_referencial: initialData?.costo_referencial ?? undefined,
      stock_minimo: initialData?.stock_minimo ?? 0,
      proveedor_id: initialData?.proveedor_id ?? undefined,
      categoria_id: initialData?.categoria_id ?? undefined,
      is_disabled: initialData?.is_disabled ?? false,
      stock_inicial: undefined,
      almacen_inicial_id: almacenes[0]?.id ?? undefined,
      lote_inicial: "",
      fecha_vencimiento_inicial: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const payload = {
      nombre: values.nombre,
      descripcion: values.descripcion ?? null,
      kind: values.kind,
      sku: values.sku || null,
      unidad: (values.unidad ?? "unidad") as "unidad" | "caja" | "ml" | "tableta" | "frasco" | "kg" | "ampolla" | "sobre" | "otro",
      precio_inc: Number(values.precio_inc),
      costo_referencial: values.costo_referencial ? Number(values.costo_referencial) : null,
      stock_minimo: Number(values.stock_minimo ?? 0),
      proveedor_id: values.proveedor_id || null,
      categoria_id: values.categoria_id || null,
      is_disabled: values.is_disabled ?? false,
      stock_inicial: !initialData && values.stock_inicial ? Number(values.stock_inicial) : null,
      almacen_inicial_id: !initialData ? values.almacen_inicial_id || null : null,
      lote_inicial: !initialData ? values.lote_inicial || null : null,
      fecha_vencimiento_inicial: !initialData ? values.fecha_vencimiento_inicial || null : null,
    };

    const res = initialData
      ? await actualizarProducto(initialData.id, payload)
      : await crearProducto(payload);

    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(initialData ? "Producto actualizado" : "Producto creado");
    router.refresh();
    onSuccess();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{initialData ? "Editar producto" : "Nuevo producto"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nombre *</FormLabel>
                <FormControl><Input placeholder="Ej. Vacuna Antirrábica" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="sku" render={({ field }) => (
              <FormItem>
                <FormLabel>SKU / Código</FormLabel>
                <FormControl><Input placeholder="Opcional" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="unidad" render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {UNIDADES_VALIDAS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="precio_inc" render={({ field }) => (
              <FormItem>
                <FormLabel>Precio venta (S/.) *</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" {...field} value={Number(field.value)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="costo_referencial" render={({ field }) => (
              <FormItem>
                <FormLabel>Costo ref. (S/.)</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" placeholder="Opcional" name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value != null ? String(field.value) : ""} onChange={e => field.onChange(e.target.value === "" ? null : e.target.value)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="stock_minimo" render={({ field }) => (
              <FormItem>
                <FormLabel>Stock mínimo</FormLabel>
                <FormControl><Input type="number" min="0" {...field} value={Number(field.value)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="categoria_id" render={({ field }) => {
              const catValue = field.value;
              const catLabel = catValue ? (categorias.find(c => c.id === catValue)?.nombre || "Categoría no encontrada") : "Sin categoría";
              return (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={(v) => field.onChange(v === "none" ? null : v)} value={catValue || "none"}>
                  <FormControl>
                    <SelectTrigger className={!catValue ? "text-muted-foreground" : ""}>
                      <span className="line-clamp-1 flex-1 text-left">{catLabel}</span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}} />
            <FormField control={form.control} name="proveedor_id" render={({ field }) => {
              const provValue = field.value;
              const provLabel = provValue ? (proveedores.find(p => p.id === provValue)?.nombre || "Proveedor no encontrado") : "Sin proveedor";
              return (
              <FormItem className="col-span-2">
                <FormLabel>Proveedor</FormLabel>
                <Select onValueChange={(v) => field.onChange(v === "none" ? null : v)} value={provValue || "none"}>
                  <FormControl>
                    <SelectTrigger className={!provValue ? "text-muted-foreground" : ""}>
                      <span className="line-clamp-1 flex-1 text-left">{provLabel}</span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {proveedores.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}} />
            <FormField control={form.control} name="descripcion" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl><Textarea rows={2} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {initialData && (
              <FormField control={form.control} name="is_disabled" render={({ field }) => (
                <FormItem className="col-span-2 flex items-center gap-3 rounded-lg border p-3">
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm font-medium">Producto inactivo</FormLabel>
                    <p className="text-xs text-muted-foreground">No aparecerá en ventas ni búsquedas activas.</p>
                  </div>
                </FormItem>
              )} />
            )}

            {!initialData && form.watch("kind") === "producto" && (
              <div className="col-span-2 mt-2 flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
                <h4 className="text-sm font-medium leading-none">Stock Inicial (Opcional)</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="stock_inicial" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad inicial</FormLabel>
                      <FormControl><Input type="number" min="0" placeholder="0" {...field} value={field.value ? Number(field.value) : ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="almacen_inicial_id" render={({ field }) => {
                    const selectedAlmacen = almacenes.find(a => a.id === field.value);
                    const almacenLabel = selectedAlmacen ? selectedAlmacen.nombre : "Selecciona almacén";
                    return (
                    <FormItem>
                      <FormLabel>Almacén</FormLabel>
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

                  <FormField control={form.control} name="lote_inicial" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote</FormLabel>
                      <FormControl><Input placeholder="Opcional" {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="fecha_vencimiento_inicial" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimiento</FormLabel>
                      <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : (initialData ? "Guardar cambios" : "Crear producto")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
