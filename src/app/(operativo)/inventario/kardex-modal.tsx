"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getKardexProducto } from "./actions";
import { formatMotivoMovimiento, type MovimientoKardex } from "./types";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Loader2 } from "lucide-react";

const TIPO_META: Record<string, { label: string; color: string; signo: "+" | "-" | "~" }> = {
  entrada:          { label: "Entrada",      color: "bg-emerald-100 text-emerald-800", signo: "+" },
  compra:           { label: "Compra",       color: "bg-emerald-100 text-emerald-800", signo: "+" },
  inventario_inicial: { label: "Inv. inicial", color: "bg-blue-100 text-blue-800",   signo: "+" },
  salida:           { label: "Salida",       color: "bg-red-100 text-red-800",        signo: "-" },
  merma:            { label: "Merma",        color: "bg-orange-100 text-orange-800",  signo: "-" },
  venta:            { label: "Venta",        color: "bg-purple-100 text-purple-800",  signo: "-" },
  reversion_venta:  { label: "Reversión",   color: "bg-yellow-100 text-yellow-800",  signo: "+" },
  ajuste_manual:    { label: "Ajuste",       color: "bg-gray-100 text-gray-800",      signo: "~" },
  correccion:       { label: "Corrección",   color: "bg-gray-100 text-gray-800",      signo: "~" },
};

interface Props {
  itemId: string;
  itemNombre: string;
}

export function KardexModal({ itemId, itemNombre }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getKardexProducto(itemId, 50).then((res) => {
      if (res.error) setError(res.error);
      else setMovimientos(res.data);
      setLoading(false);
    });
  }, [itemId]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          Historial de stock — {itemNombre}
        </DialogTitle>
        <DialogDescription>Últimos 50 movimientos de stock registrados.</DialogDescription>
      </DialogHeader>

      <div className="mt-3 max-h-[60vh] overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando historial...
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-destructive text-center py-6">{error}</p>
        )}

        {!loading && !error && movimientos.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            No hay movimientos registrados para este producto.
          </div>
        )}

        {!loading && !error && movimientos.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Ant.</TableHead>
                <TableHead className="text-right">Nuevo</TableHead>
                <TableHead>Motivo / Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientos.map((m) => {
                const meta = TIPO_META[m.tipo] ?? { label: m.tipo, color: "bg-gray-100 text-gray-800", signo: "~" };
                const esNegativo = m.qty < 0;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(m.created_at), "dd MMM HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${meta.color} border-none text-[10px] px-2 py-0.5`}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold text-sm ${esNegativo ? "text-red-600" : "text-emerald-600"}`}>
                      {esNegativo ? "" : "+"}{m.qty}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {m.stock_anterior ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {m.stock_nuevo ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[160px]">
                      <div className="truncate">{formatMotivoMovimiento(m.motivo) ?? m.notas ?? "—"}</div>
                      {m.lote && <div className="text-[10px] text-muted-foreground">Lote: {m.lote}</div>}
                      {m.fecha_vencimiento && (
                        <div className="text-[10px] text-orange-600">Vence: {format(new Date(m.fecha_vencimiento), "dd/MM/yyyy")}</div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
