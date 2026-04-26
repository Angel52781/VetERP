"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Calculator, 
  Lock, 
  Unlock, 
  DollarSign, 
  CreditCard, 
  ArrowRightLeft, 
  Loader2,
  History,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { abrirCaja, cerrarCaja } from "../caja_inventario/actions";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface CierreCaja {
  id: string;
  estado: "abierta" | "cerrada";
  monto_apertura: number;
  fecha_apertura: string;
  total_sistema?: number;
}

interface ResumenCaja {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  total: number;
}

export function CorteCajaClient({ 
  cierreActual, 
  resumenActual,
  historial
}: { 
  cierreActual: CierreCaja | null, 
  resumenActual: ResumenCaja,
  historial: any[]
}) {
  const [loading, setLoading] = useState(false);
  const [montoApertura, setMontoApertura] = useState<number>(0);
  const [montoReal, setMontoReal] = useState<number>(0);
  const [notas, setNotas] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  async function handleAbrir() {
    setLoading(true);
    const { error } = await abrirCaja({ monto_apertura: montoApertura });
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Caja abierta correctamente");
      setOpenDialog(false);
    }
  }

  async function handleCerrar() {
    setLoading(true);
    const { error } = await cerrarCaja({ 
      monto_cierre_efectivo_real: montoReal,
      notas: notas 
    });
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Caja cerrada satisfactoriamente");
      setOpenDialog(false);
    }
  }

  if (!cierreActual) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Caja Cerrada</h3>
            <p className="text-sm text-muted-foreground">Debes abrir caja para registrar nuevos cobros.</p>
          </div>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger render={
              <Button size="lg" className="px-8">
                <Unlock className="mr-2 h-4 w-4" />
                Abrir Caja
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apertura de Caja</DialogTitle>
                <DialogDescription>Ingresa el monto inicial con el que empiezas el turno.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Inicial (Fondo de caja)</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={montoApertura} 
                    onChange={e => setMontoApertura(Number(e.target.value))} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                <Button onClick={handleAbrir} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Turno
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Efectivo (Sistema)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-2xl font-bold">${resumenActual.efectivo.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Tarjeta (Sistema)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">${resumenActual.tarjeta.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Transf. (Sistema)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-600" />
              <span className="text-2xl font-bold">${resumenActual.transferencia.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-primary">Total Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold text-primary">${resumenActual.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Corte de Caja</CardTitle>
              <CardDescription>Resumen de la sesión actual iniciada el {format(new Date(cierreActual.fecha_apertura), "PPP p", { locale: es })}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Sesión Abierta
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Fondo Inicial</p>
              <p className="font-semibold text-lg">${Number(cierreActual.monto_apertura).toFixed(2)}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Efectivo en Caja (Esperado)</p>
              <p className="font-semibold text-lg text-emerald-600">
                ${(Number(cierreActual.monto_apertura) + resumenActual.efectivo).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/5 py-4">
          <p className="text-xs text-muted-foreground italic">
            * El total esperado incluye el fondo inicial más los cobros en efectivo.
          </p>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger render={
              <Button variant="destructive">
                <Lock className="mr-2 h-4 w-4" />
                Cerrar Caja y Terminar Turno
              </Button>
            } />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cierre de Caja</DialogTitle>
                <DialogDescription>Confirma los montos reales antes de cerrar la sesión.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Total Sistema</p>
                    <p className="font-bold text-lg">${resumenActual.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Efectivo Esperado</p>
                    <p className="font-bold text-lg">${(Number(cierreActual.monto_apertura) + resumenActual.efectivo).toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Efectivo Real en Caja (Contado)</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="text-lg font-bold"
                    value={montoReal} 
                    onChange={e => setMontoReal(Number(e.target.value))} 
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Diferencia: <span className={montoReal - (Number(cierreActual.monto_apertura) + resumenActual.efectivo) !== 0 ? "text-red-600 font-bold" : "text-emerald-600"}>
                      ${(montoReal - (Number(cierreActual.monto_apertura) + resumenActual.efectivo)).toFixed(2)}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notas / Observaciones</label>
                  <Textarea 
                    placeholder="Ej. Faltante de $5 por cambio, etc." 
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleCerrar} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar y Cerrar Caja
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
      
      {/* Historial Básico */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Últimos Cierres</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historial.length > 0 ? historial.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{format(new Date(h.fecha_cierre), "PPP p", { locale: es })}</p>
                    <p className="text-xs text-muted-foreground">Cerrado por el sistema</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${Number(h.total_sistema).toFixed(2)}</p>
                  <p className={`text-[10px] ${Number(h.monto_cierre_efectivo_real) - (Number(h.monto_apertura) + Number(h.monto_efectivo_sistema)) !== 0 ? "text-red-500" : "text-emerald-500"}`}>
                    Dif: ${(Number(h.monto_cierre_efectivo_real) - (Number(h.monto_apertura) + Number(h.monto_efectivo_sistema))).toFixed(2)}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay cierres previos registrados.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
