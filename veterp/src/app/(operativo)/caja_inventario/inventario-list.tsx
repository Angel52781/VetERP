"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

import { z } from "zod";
import { movimientoStockSchema, MovimientoStockInput } from "@/lib/validators/ajustes";
import { addMovimientoStock } from "./actions";

interface InventarioItem {
  id: string;
  nombre: string;
  is_disabled: boolean;
  stock: number;
}

interface Almacen {
  id: string;
  nombre: string;
}

export function MovimientoStockForm({
  itemId,
  almacenes,
  onSuccess,
}: {
  itemId: string;
  almacenes: Almacen[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.input<typeof movimientoStockSchema>>({
    resolver: zodResolver(movimientoStockSchema),
    defaultValues: {
      item_id: itemId,
      almacen_id: almacenes[0]?.id || "",
      qty: 0,
      tipo: "ajuste_manual",
      notas: "",
    },
  });

  async function onSubmit(data: z.input<typeof movimientoStockSchema>) {
    setIsSubmitting(true);
    
    const res = await addMovimientoStock(data as MovimientoStockInput);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Movimiento de stock registrado");
    form.reset();
    router.refresh();
    if (onSuccess) onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="almacen_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un almacén" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {almacenes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre}
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
            name="qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad (+/-)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej. 10 o -5" {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimiento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ajuste_manual">Ajuste Manual</SelectItem>
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="merma">Merma/Pérdida</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas / Razón</FormLabel>
              <FormControl>
                <Textarea placeholder="Motivo del ajuste" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function InventarioList({
  inventario,
  almacenes,
}: {
  inventario: InventarioItem[];
  almacenes: Almacen[];
}) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table className="[&_td]:py-2 [&_th]:py-3 text-sm">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="text-right w-[140px]">Stock Actual</TableHead>
              <TableHead className="w-[120px] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventario.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={PackageSearch}
                    title="Inventario vacío"
                    description="No hay productos registrados en el catálogo que controlen stock."
                  />
                </TableCell>
              </TableRow>
            ) : (
              inventario.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>
                    {item.is_disabled ? (
                      <Badge variant="destructive">Inactivo</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={item.stock <= 0 ? "text-red-500" : "text-emerald-600"}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Dialog 
                      open={selectedItem === item.id} 
                      onOpenChange={(open) => setSelectedItem(open ? item.id : null)}
                    >
                      <DialogTrigger render={<Button variant="outline" size="sm" />}>
                        Ajustar
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Ajuste de Stock: {item.nombre}</DialogTitle>
                        </DialogHeader>
                        {almacenes.length === 0 ? (
                          <div className="py-4 text-center text-red-500">
                            Debes crear un almacén en Ajustes antes de registrar movimientos.
                          </div>
                        ) : (
                          <MovimientoStockForm
                            itemId={item.id}
                            almacenes={almacenes}
                            onSuccess={() => setSelectedItem(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}