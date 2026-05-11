"use client";

import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { registrarAbonoCliente } from "@/app/(operativo)/caja_inventario/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

type AbonoClienteDialogProps = {
  clienteId: string;
};

export function AbonoClienteDialog({ clienteId }: AbonoClienteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setMonto("");
    setMetodoPago("efectivo");
    setNotas("");
    setError(null);
  }

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) resetForm();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const montoNumber = Number(monto);
    if (!Number.isFinite(montoNumber) || montoNumber <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    startTransition(async () => {
      const result = await registrarAbonoCliente({
        cliente_id: clienteId,
        monto: montoNumber,
        metodo_pago: metodoPago,
        notas_text: notas.trim() || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Wallet className="mr-2 h-4 w-4" />
        Registrar anticipo
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar anticipo</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="abono-monto">Monto</Label>
            <Input
              id="abono-monto"
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(event) => setMonto(event.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abono-metodo">Método de pago</Label>
            <Select value={metodoPago} onValueChange={(value) => setMetodoPago(value as MetodoPago)}>
              <SelectTrigger id="abono-metodo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="abono-notas">Notas</Label>
            <Textarea
              id="abono-notas"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              placeholder="Referencia, motivo o detalle del anticipo"
              rows={3}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
