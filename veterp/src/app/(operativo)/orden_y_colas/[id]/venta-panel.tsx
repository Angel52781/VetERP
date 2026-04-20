"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getOrCreateVenta, addItemToVenta, removeVentaItem, registrarPago } from "@/app/(operativo)/caja_inventario/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function VentaPanel({ ordenId, clienteId, itemsCatalogo }: { ordenId: string, clienteId: string, itemsCatalogo: any[] }) {
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [pagoMonto, setPagoMonto] = useState<number>(0);

  const loadVenta = async () => {
    setLoading(true);
    const { error, data } = await getOrCreateVenta(ordenId, clienteId);
    if (error) {
      toast.error(error);
    } else {
      setVenta(data);
      // Sugerir monto restante a pagar
      const totalPagado = data.ledger?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;
      setPagoMonto(Math.max(0, Number(data.total) - totalPagado));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVenta();
  }, [ordenId, clienteId]);

  const handleAddItem = async () => {
    if (!selectedItem || cantidad < 1) return;
    setLoadingAction(true);
    const { error, data } = await addItemToVenta(venta.id, {
      item_id: selectedItem,
      cantidad,
      precio_unitario: 0, // se calcula en el backend
    });
    
    if (error) {
      toast.error(error);
    } else {
      toast.success("El ítem ha sido agregado a la venta.");
      setSelectedItem("");
      setCantidad(1);
      await loadVenta();
    }
    setLoadingAction(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    setLoadingAction(true);
    const { error } = await removeVentaItem(itemId, venta.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Item eliminado");
      await loadVenta();
    }
    setLoadingAction(false);
  };

  const handleRegistrarPago = async () => {
    if (pagoMonto <= 0) return;
    setLoadingAction(true);
    const { error } = await registrarPago(venta.id, {
      cliente_id: clienteId,
      orden_id: ordenId,
      monto: pagoMonto,
      tipo: "pago"
    });
    
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Se registró un pago por $${pagoMonto}`);
      await loadVenta();
    }
    setLoadingAction(false);
  };

  if (!venta && !loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
          <p className="text-muted-foreground text-sm">Aún no hay venta generada o no se ha cargado.</p>
          <Button onClick={loadVenta}>
            Cargar Venta
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading && !venta) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalPagado = venta.ledger?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;
  const saldoPendiente = Math.max(0, Number(venta.total) - totalPagado);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Resumen de Venta</h2>
          <p className="text-sm text-muted-foreground">Agrega servicios o productos a la orden.</p>
        </div>
        <Badge variant={venta.estado === "pagada" ? "default" : "secondary"} className="text-sm px-4 py-1">
          {venta.estado === "pagada" ? "Pagada" : "Abierta"}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Ítems</CardTitle>
            </CardHeader>
            <CardContent>
              {venta.estado !== "pagada" && (
                <div className="flex gap-2 mb-6 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium">Producto/Servicio</label>
                    <Select value={selectedItem} onValueChange={(val) => setSelectedItem(val || "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un ítem..." />
                      </SelectTrigger>
                      <SelectContent>
                        {itemsCatalogo.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nombre} - ${item.precio_inc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-xs font-medium">Cantidad</label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={cantidad} 
                      onChange={e => setCantidad(Number(e.target.value))} 
                    />
                  </div>
                  <Button onClick={handleAddItem} disabled={!selectedItem || loadingAction}>
                    {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              )}

              {venta.items_venta && venta.items_venta.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ítem</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">P. Unitario</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {venta.estado !== "pagada" && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venta.items_venta.map((iv: any) => (
                      <TableRow key={iv.id}>
                        <TableCell className="font-medium">
                          {iv.items_catalogo?.nombre}
                          <Badge variant="outline" className="ml-2 text-[10px] uppercase">{iv.items_catalogo?.kind}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{iv.cantidad}</TableCell>
                        <TableCell className="text-right">${Number(iv.precio_unitario).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${Number(iv.total_linea).toFixed(2)}</TableCell>
                        {venta.estado !== "pagada" && (
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(iv.id)} disabled={loadingAction} className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-md border-dashed">
                  No hay ítems en esta venta.
                </div>
              )}
            </CardContent>
          </Card>
          
          {venta.ledger && venta.ledger.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venta.ledger.map((pago: any) => (
                      <TableRow key={pago.id}>
                        <TableCell>{format(new Date(pago.fecha), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                        <TableCell className="capitalize">{pago.tipo}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">${Number(pago.monto).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${Number(venta.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Pagado</span>
                <span>${totalPagado.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total a Pagar</span>
                <span>${saldoPendiente.toFixed(2)}</span>
              </div>
            </CardContent>
            
            {venta.estado !== "pagada" && saldoPendiente > 0 && (
              <CardFooter className="flex-col gap-3 pt-0">
                <div className="flex gap-2 w-full items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium">Monto</label>
                    <Input 
                      type="number" 
                      min="0.01" 
                      step="0.01"
                      value={pagoMonto} 
                      onChange={e => setPagoMonto(Number(e.target.value))} 
                    />
                  </div>
                  <Button 
                    className="w-auto shrink-0" 
                    onClick={handleRegistrarPago}
                    disabled={loadingAction || pagoMonto <= 0 || pagoMonto > saldoPendiente}
                  >
                    {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4 mr-1" />}
                    Pagar
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
