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
import { z } from "zod";

import { categoriaSchema, CategoriaInput } from "@/lib/validators/ajustes";
import { createCategoria, updateCategoria } from "./actions";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export function CategoriaForm({
  onSuccess,
  initialData,
}: {
  onSuccess?: () => void;
  initialData?: Categoria;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.input<typeof categoriaSchema>>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
    },
  });

  async function onSubmit(formData: z.input<typeof categoriaSchema>) {
    const data = formData as CategoriaInput;
    setIsSubmitting(true);
    let error;

    if (initialData) {
      const res = await updateCategoria(initialData.id, data);
      error = res.error;
    } else {
      const res = await createCategoria(data);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(`Categoría ${initialData ? "actualizada" : "creada"} exitosamente`);
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
                <Input placeholder="Ej. Cirugías, Alimentos, etc." {...field} />
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function CategoriasList({ categorias }: { categorias: Categoria[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Categoria | null>(null);

  const handleEdit = (item: Categoria) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => setEditingItem(null), 200);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Categorías</h2>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
            </DialogHeader>
            <CategoriaForm
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
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No hay categorías registradas.
                </TableCell>
              </TableRow>
            ) : (
              categorias.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>{item.descripcion || "-"}</TableCell>
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
