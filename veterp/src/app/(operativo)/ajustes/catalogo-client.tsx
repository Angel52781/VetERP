"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Search, FilterX } from "lucide-react";

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
  categorias_catalogo: { nombre: string } | null;
  categoria_id: string | null;
}

interface Proveedor {
  id: string;
  nombre: string;
}

interface Categoria {
  id: string;
  nombre: string;
}

export function ItemCatalogoForm({
  proveedores,
  categorias,
  onSuccess,
  initialData,
}: {
  proveedores: Proveedor[];
  categorias: Categoria[];
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
      categoria_id: initialData?.categoria_id || "",
      is_disabled: initialData?.is_disabled || false,
    },
  });

  async function onSubmit(formData: z.input<typeof itemCatalogoSchema>) {
    const data = formData as ItemCatalogoInput;
    setIsSubmitting(true);
    let error;

    // Convert empty string or "none" to null for UUID fields
    const payload = {
      ...data,
      proveedor_id: data.proveedor_id === "" || data.proveedor_id === "none" ? null : data.proveedor_id,
      categoria_id: data.categoria_id === "" || data.categoria_id === "none" ? null : data.categoria_id,
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {categorias.map((c) => (
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
                      <SelectValue placeholder="Proveedor (opcional)" />
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
        </div>

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
  categorias,
}: {
  items: ItemCatalogo[];
  proveedores: Proveedor[];
  categorias: Categoria[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCatalogo | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("activos");
  const [categoriaFilter, setCategoriaFilter] = useState("todas");

  // Paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const handleEdit = (item: ItemCatalogo) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => setEditingItem(null), 200);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTipoFilter("todos");
    setEstadoFilter("activos");
    setCategoriaFilter("todas");
    setPage(1);
  };

  // Lógica de filtrado
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search (nombre o descripción)
      const q = search.toLowerCase();
      if (q && !item.nombre.toLowerCase().includes(q) && !(item.descripcion || "").toLowerCase().includes(q)) {
        return false;
      }
      // Tipo
      if (tipoFilter !== "todos" && item.kind !== tipoFilter) {
        return false;
      }
      // Estado
      if (estadoFilter === "activos" && item.is_disabled) return false;
      if (estadoFilter === "inactivos" && !item.is_disabled) return false;
      // Categoría
      if (categoriaFilter !== "todas" && item.categoria_id !== categoriaFilter) {
        return false;
      }
      return true;
    });
  }, [items, search, tipoFilter, estadoFilter, categoriaFilter]);

  // Lógica de paginación
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              categorias={categorias || []}
              initialData={editingItem || undefined}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 bg-muted/20 p-3 rounded-lg border border-dashed">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={categoriaFilter} onValueChange={(v) => { setCategoriaFilter(v as string); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v as string); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="producto">Producto</SelectItem>
            <SelectItem value="servicio">Servicio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v as string); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activos">Solo activos</SelectItem>
            <SelectItem value="inactivos">Solo inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpiar filtros">
          <FilterX className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo / Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron resultados para los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.nombre}</div>
                    {item.descripcion && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={item.descripcion}>
                        {item.descripcion}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.kind === "producto" ? "default" : "secondary"}>
                        {item.kind}
                      </Badge>
                      {item.categorias_catalogo?.nombre && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {item.categorias_catalogo.nombre}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${Number(item.precio_inc).toFixed(2)}</TableCell>
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

      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <div>
            Mostrando {((page - 1) * itemsPerPage) + 1} a {Math.min(page * itemsPerPage, filteredItems.length)} de {filteredItems.length} ítems
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="min-w-[40px] text-center">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
