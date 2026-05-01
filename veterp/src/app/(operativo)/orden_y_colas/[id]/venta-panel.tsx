"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getVentasDeOrden, addItemToVenta, removeVentaItem, registrarPago, crearVenta } from "@/app/(operativo)/caja_inventario/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, DollarSign, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { formatMoneyPEN } from "@/lib/money";

export function VentaPanel({ ordenId, clienteId, itemsCatalogo, initialVentas }: { ordenId: string, clienteId: string, itemsCatalogo: any[], initialVentas: any[] }) {
  const [ventas, setVentas] = useState<any[]>(initialVentas);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [pagoMonto, setPagoMonto] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");

  const loadVentas = async () => {
    setLoading(true);
    const { error, data } = await getVentasDeOrden(ordenId);
    if (error) {
      toast.error(error);
    } else {
      setVentas(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const activeVenta = ventas.find(v => v.estado === "abierta");
    if (activeVenta) {
      const totalPagado = activeVenta.ledger?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;
      setPagoMonto(Math.max(0, Number(activeVenta.total) - totalPagado));
    } else {
      setPagoMonto(0);
    }
  }, [ventas]);

  const handleCrearVenta = async () => {
    setLoadingAction(true);
    const { error, reused } = await crearVenta(ordenId, clienteId);
    if (error) {
      toast.error("Error al iniciar nuevo cobro");
    } else {
      if (reused) {
        toast.info("Ya existía un cobro abierto para esta atención.");
      } else {
        toast.success("Nuevo cobro iniciado");
      }
      await loadVentas();
    }
    setLoadingAction(false);
  };

  const handleAddItem = async (ventaId: string) => {
    if (!selectedItem || cantidad < 1) return;
    setLoadingAction(true);
    const { error } = await addItemToVenta(ventaId, {
      item_id: selectedItem,
      cantidad,
      precio_unitario: 0,
    });
    
    if (error) {
      toast.error(error);
    } else {
      toast.success("Ítem agregado a la venta.");
      setSelectedItem("");
      setCantidad(1);
      await loadVentas();
    }
    setLoadingAction(false);
  };

  const handleRemoveItem = async (itemId: string, ventaId: string) => {
    setLoadingAction(true);
    const { error } = await removeVentaItem(itemId, ventaId);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Ítem eliminado");
      await loadVentas();
    }
    setLoadingAction(false);
  };

  const handleRegistrarPago = async (ventaId: string, maxMonto: number) => {
    if (pagoMonto <= 0 || pagoMonto > maxMonto) return;
    setLoadingAction(true);
    const { error } = await registrarPago(ventaId, {
      cliente_id: clienteId,
      orden_id: ordenId,
      monto: pagoMonto,
      tipo: "pago",
      metodo_pago: metodoPago as any
    });
    
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Se registró un pago por ${formatMoneyPEN(pagoMonto)}`);
      await loadVentas();
    }
    setLoadingAction(false);
  };

  if (loading && ventas.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pagadas = ventas.filter(v => v.estado === "pagada");
  const abierta = ventas.find(v => v.estado === "abierta");

  return (
    <div className="space-y-8">
      {/* VENTAS PAGADAS (Historial Read-Only) */}
      {pagadas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Historial de Cobros (Pagados)</h3>
          {pagadas.map((vp) => {
            const totalPagado = vp.ledger?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;
            return (
              <Card key={vp.id} className="bg-muted/30 border-muted">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/50">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ReceiptText className="w-4 h-4 text-emerald-600" />
                    Cobro del {format(new Date(vp.created_at), "dd/MM/yyyy HH:mm")}
                  </div>
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Pagada</Badge>
                </CardHeader>
                <CardContent className="p-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Ítems Cobrados:</h4>
                    <ul className="text-sm space-y-1">
                      {vp.items_venta?.map((iv: any) => (
                        <li key={iv.id} className="flex justify-between border-b border-dashed border-border/50 pb-1">
                          <span>{iv.cantidad}x {iv.items_catalogo?.nombre}</span>
                          <span className="text-muted-foreground">{formatMoneyPEN(iv.total_linea)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between font-bold text-sm mt-2">
                      <span>Total:</span>
                      <span>{formatMoneyPEN(vp.total)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Pagos Aplicados:</h4>
                    <ul className="text-sm space-y-1">
                      {vp.ledger?.map((l: any) => (
                        <li key={l.id} className="flex justify-between border-b border-dashed border-border/50 pb-1">
                          <span className="capitalize">{l.metodo_pago || 'efectivo'}</span>
                          <span className="text-emerald-600 font-medium">{formatMoneyPEN(l.monto)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* VENTA ABIERTA (Activa) */}
      {abierta ? (
        <div className="space-y-6 pt-4 border-t border-border/50">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Cobro Pendiente</h2>
              <p className="text-sm text-muted-foreground">Agrega servicios o productos y registra el pago para cerrar el cobro.</p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-1">Abierta</Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Ítems del Cobro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 mb-6 items-end sm:grid-cols-[minmax(0,1fr)_6rem_auto]">
                    <div className="min-w-0 space-y-1">
                      <label className="text-xs font-medium">Producto/Servicio</label>
                      <Select value={selectedItem} onValueChange={(val) => setSelectedItem(val || "")}>
                        <SelectTrigger className="h-10 w-full min-w-0">
                          <SelectValue placeholder="Selecciona un ítem...">
                            {selectedItem ? itemsCatalogo.find(i => i.id === selectedItem)?.nombre : "Selecciona un ítem..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="min-w-80 max-w-[min(32rem,calc(100vw-2rem))]">
                          {itemsCatalogo.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nombre} - {formatMoneyPEN(item.precio_inc)}
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
                    <Button onClick={() => handleAddItem(abierta.id)} disabled={!selectedItem || loadingAction}>
                      {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>

                  {abierta.items_venta && abierta.items_venta.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ítem</TableHead>
                          <TableHead className="text-right">Cant.</TableHead>
                          <TableHead className="text-right">P. Unitario</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {abierta.items_venta.map((iv: any) => (
                          <TableRow key={iv.id}>
                            <TableCell className="font-medium">
                              {iv.items_catalogo?.nombre}
                              <Badge variant="outline" className="ml-2 text-[10px] uppercase">{iv.items_catalogo?.kind}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{iv.cantidad}</TableCell>
                            <TableCell className="text-right">{formatMoneyPEN(iv.precio_unitario)}</TableCell>
                            <TableCell className="text-right">{formatMoneyPEN(iv.total_linea)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(iv.id, abierta.id)} disabled={loadingAction} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground border rounded-md border-dashed">
                      No hay ítems en este cobro. Agrega productos arriba.
                    </div>
                  )}
                </CardContent>
              </Card>

              {abierta.ledger && abierta.ledger.length > 0 && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Historial de Pagos Parciales</CardTitle>
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
                        {abierta.ledger.map((pago: any) => (
                          <TableRow key={pago.id}>
                            <TableCell>{format(new Date(pago.fecha), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                            <TableCell className="capitalize">
                              {pago.tipo} {pago.metodo_pago ? `(${pago.metodo_pago})` : ""}
                            </TableCell>
                            <TableCell className="text-right text-emerald-600 font-medium">{formatMoneyPEN(pago.monto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20 sticky top-6">
                <CardHeader>
                  <CardTitle>Totales del Cobro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatMoneyPEN(abierta.total)}</span>
                  </div>
                  {(() => {
                    const totalPagado = abierta.ledger?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;
                    const saldoPendiente = Math.max(0, Number(abierta.total) - totalPagado);
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Pagado</span>
                          <span>{formatMoneyPEN(totalPagado)}</span>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total a Pagar</span>
                          <span>{formatMoneyPEN(saldoPendiente)}</span>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
                
                {(() => {
                  const totalPagado = abierta.ledger?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;
                  const saldoPendiente = Math.max(0, Number(abierta.total) - totalPagado);
                  
                  if (saldoPendiente <= 0 && abierta.total == 0) return null;
                  if (saldoPendiente <= 0) return null;

                  return (
                    <CardFooter className="flex-col gap-4 pt-4 border-t border-primary/10 mt-4">
                      <div className="w-full text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                        Registrar Pago
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs font-medium">Monto a Cobrar</label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              min="0.01" 
                              step="0.01"
                              className="pl-8 h-10 text-lg font-medium"
                              value={pagoMonto} 
                              onChange={e => setPagoMonto(Number(e.target.value))} 
                            />
                          </div>
                        </div>
                        <div className="space-y-1 w-full">
                          <label className="text-xs font-medium">Método de Pago</label>
                          <Select value={metodoPago} onValueChange={(val) => setMetodoPago(val || "efectivo")}>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          className="h-10 w-full mt-2" 
                          onClick={() => handleRegistrarPago(abierta.id, saldoPendiente)}
                          disabled={loadingAction || pagoMonto <= 0 || pagoMonto > saldoPendiente}
                        >
                          {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4 mr-2" />}
                          Confirmar Pago
                        </Button>
                      </div>
                    </CardFooter>
                  );
                })()}
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* NO HAY VENTA ABIERTA */
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/10">
          <ReceiptText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hay cobros pendientes</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Si necesitas facturar nuevos productos o servicios a esta atención, inicia un nuevo cobro.
          </p>
          <Button onClick={handleCrearVenta} disabled={loadingAction} className="bg-primary">
            {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Iniciar Nuevo Cobro
          </Button>
        </div>
      )}
    </div>
  );
}
