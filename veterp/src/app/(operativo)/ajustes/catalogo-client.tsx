"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Edit2 } from "lucide-react";

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

import { z } from "zod";

import { itemCatalogoSchema, ItemCatalogoInput } from "@/lib/validators/ajustes";
import { createItemCatalogo, updateItemCatalogo } from "./actions";

interface ItemCatalogo {
  id: string;
  nombre: string;
  descripcion: string | null;
  kind: string;
  precio_inc: number;
  is_disabled: boolean;
  proveedores: { nombre: string } | null;
  proveedor_id: string | null;
}

interface Proveedor {
  id: string;
  nombre: string;
}

export function ItemCatalogoForm({
  proveedores,
  onSuccess,
  initialData,
}: {
  proveedores: Proveedor[];
  onSuccess?: () => void;
  initialData?: ItemCatalogo;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.input<typeof itemCatalogoSchema>>({
    resolver: zodResolver(itemCatalogoSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
      kind: (initialData?.kind as any) || "producto",
      precio_inc: initialData?.precio_inc || 0,
      proveedor_id: initialData?.proveedor_id || "",
      is_disabled: initialData?.is_disabled || false,
    },
  });

  async function onSubmit(formData: z.input<typeof itemCatalogoSchema>) {
    const data = formData as ItemCatalogoInput;
    setIsSubmitting(true);
    let error;

        // Convert empty string or "none" to null for proveedor_id
    const payload = {
      ...data,
      proveedor_id: data.proveedor_id === "" || data.proveedor_id === "none" ? null : data.proveedor_id,
    };

    if (initialData) {
      const res = await updateItemCatalogo(initialData.id, payload);
      error = res.error;
    } else {
      const res = await createItemCatalogo(payload);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(`Ítem ${initialData ? "actualizado" : "creado"} exitosamente`);
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
                <Input placeholder="Ej. Vacuna Antirrábica" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Opcional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="producto">Producto</SelectItem>
                    <SelectItem value="servicio">Servicio</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="precio_inc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (Inc. IGV)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} value={field.value as string | number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="proveedor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
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
          name="is_disabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Deshabilitado</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Marcar para ocultar del catálogo activo.
                </div>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function CatalogoList({
  items,
  proveedores,
}: {
  items: ItemCatalogo[];
  proveedores: Proveedor[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCatalogo | null>(null);

  const handleEdit = (item: ItemCatalogo) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Small delay to allow dialog close animation before clearing form data
      setTimeout(() => setEditingItem(null), 200);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Servicios y Productos</h2>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ítem
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Ítem" : "Nuevo Ítem de Catálogo"}
              </DialogTitle>
            </DialogHeader>
            <ItemCatalogoForm
              proveedores={proveedores}
              initialData={editingItem || undefined}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No hay ítems en el catálogo.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={item.kind === "producto" ? "default" : "secondary"}>
                      {item.kind}
                    </Badge>
                  </TableCell>
                  <TableCell>${Number(item.precio_inc).toFixed(2)}</TableCell>
                  <TableCell>{item.proveedores?.nombre || "-"}</TableCell>
                  <TableCell>
                    {item.is_disabled ? (
                      <Badge variant="destructive">Inactivo</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
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
