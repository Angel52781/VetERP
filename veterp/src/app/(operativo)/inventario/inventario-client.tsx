"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Edit2, ArrowDownToLine, ArrowUpFromLine, History, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProductoForm } from "./producto-form";
import { MovimientoForm } from "./movimiento-form";
import { KardexModal } from "./kardex-modal";
import type { ProductoInventario } from "./types";

interface Props {
  productos: ProductoInventario[];
  almacenes: { id: string; nombre: string }[];
  proveedores: { id: string; nombre: string }[];
  categorias: { id: string; nombre: string }[];
}

type DialogMode =
  | { tipo: "nuevo" }
  | { tipo: "editar"; producto: ProductoInventario }
  | { tipo: "movimiento"; producto: ProductoInventario; accion: "entrada" | "salida" | "ajuste" }
  | { tipo: "kardex"; producto: ProductoInventario }
  | null;

export function InventarioClient({ productos, almacenes, proveedores, categorias }: Props) {
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("activos");

  const cerrar = () => setDialog(null);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const q = busqueda.toLowerCase();
      if (q && !p.nombre.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false;
      if (filtroCategoria !== "todas" && p.categoria_id !== filtroCategoria) return false;
      if (filtroEstado === "activos" && p.is_disabled) return false;
      if (filtroEstado === "inactivos" && !p.is_disabled) return false;
      return true;
    });
  }, [productos, busqueda, filtroCategoria, filtroEstado]);

  const sinStock = productosFiltrados.filter((p) => !p.is_disabled && p.stock <= 0).length;
  const stockBajo = productosFiltrados.filter((p) => !p.is_disabled && p.stock > 0 && p.stock <= p.stock_minimo && p.stock_minimo > 0).length;

  return (
    <div className="space-y-5">
      {/* Alertas globales */}
      {(sinStock > 0 || stockBajo > 0) && (
        <div className="flex flex-wrap gap-3">
          {sinStock > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>{sinStock}</strong> producto{sinStock > 1 ? "s" : ""} sin stock</span>
            </div>
          )}
          {stockBajo > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>{stockBajo}</strong> producto{stockBajo > 1 ? "s" : ""} bajo stock mínimo</span>
            </div>
          )}
        </div>
      )}

      {/* Controles superiores */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre o SKU..."
              className="pl-8 w-56"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Select value={filtroCategoria} onValueChange={(v) => setFiltroCategoria(v ?? "todas")}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? "activos")}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Solo activos</SelectItem>
              <SelectItem value="inactivos">Solo inactivos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialog?.tipo === "nuevo"} onOpenChange={(o) => !o && cerrar()}>
          <DialogTrigger render={<Button className="gap-2 shrink-0" />} onClick={() => setDialog({ tipo: "nuevo" })}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <ProductoForm proveedores={proveedores} categorias={categorias} almacenes={almacenes} onSuccess={cerrar} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Precio (S/.)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[160px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No hay productos que coincidan con los filtros.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              productosFiltrados.map((p) => {
                const sinStockItem = !p.is_disabled && p.stock <= 0;
                const stockBajoItem = !p.is_disabled && p.stock > 0 && p.stock_minimo > 0 && p.stock <= p.stock_minimo;
                return (
                  <TableRow key={p.id} className={p.is_disabled ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="font-medium text-sm">{p.nombre}</div>
                      <div className="text-xs text-muted-foreground">{p.unidad}{p.sku ? ` · ${p.sku}` : ""}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.categorias_catalogo?.nombre ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold text-sm ${sinStockItem ? "text-red-600" : stockBajoItem ? "text-orange-600" : "text-emerald-700"}`}>
                        {p.stock}
                      </span>
                      {p.stock_minimo > 0 && (
                        <div className="text-[10px] text-muted-foreground">mín: {p.stock_minimo}</div>
                      )}
                      {(sinStockItem || stockBajoItem) && (
                        <AlertTriangle className={`h-3 w-3 inline ml-1 ${sinStockItem ? "text-red-500" : "text-orange-500"}`} />
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {Number(p.precio_inc).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {p.is_disabled
                        ? <Badge variant="destructive" className="text-[10px]">Inactivo</Badge>
                        : <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-none">Activo</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* Entrada */}
                        <Dialog open={dialog?.tipo === "movimiento" && dialog.producto.id === p.id && dialog.accion === "entrada"} onOpenChange={(o) => !o && cerrar()}>
                          <DialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700" title="Entrada" />} onClick={() => setDialog({ tipo: "movimiento", producto: p, accion: "entrada" })}>
                            <ArrowDownToLine className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <MovimientoForm tipoMovimiento="entrada" itemId={p.id} itemNombre={p.nombre} stockActual={p.stock} almacenes={almacenes} onSuccess={cerrar} />
                          </DialogContent>
                        </Dialog>

                        {/* Salida/Ajuste */}
                        <Dialog open={dialog?.tipo === "movimiento" && dialog.producto.id === p.id && dialog.accion === "salida"} onOpenChange={(o) => !o && cerrar()}>
                          <DialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" title="Salida / Ajuste" />} onClick={() => setDialog({ tipo: "movimiento", producto: p, accion: "salida" })}>
                            <ArrowUpFromLine className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <MovimientoForm tipoMovimiento="salida" itemId={p.id} itemNombre={p.nombre} stockActual={p.stock} almacenes={almacenes} onSuccess={cerrar} />
                          </DialogContent>
                        </Dialog>

                        {/* Kardex */}
                        <Dialog open={dialog?.tipo === "kardex" && dialog.producto.id === p.id} onOpenChange={(o) => !o && cerrar()}>
                          <DialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" title="Historial" />} onClick={() => setDialog({ tipo: "kardex", producto: p })}>
                            <History className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            {dialog?.tipo === "kardex" && dialog.producto.id === p.id && (
                              <KardexModal itemId={p.id} itemNombre={p.nombre} />
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Editar */}
                        <Dialog open={dialog?.tipo === "editar" && dialog.producto.id === p.id} onOpenChange={(o) => !o && cerrar()}>
                          <DialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" />} onClick={() => setDialog({ tipo: "editar", producto: p })}>
                            <Edit2 className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            {dialog?.tipo === "editar" && dialog.producto.id === p.id && (
                              <ProductoForm initialData={p} proveedores={proveedores} categorias={categorias} almacenes={almacenes} onSuccess={cerrar} />
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        {productosFiltrados.length} de {productos.length} productos
      </p>
    </div>
  );
}
