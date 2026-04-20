"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search } from "lucide-react";

export function VentasList({ ventas }: { ventas: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVentas = ventas.filter((v: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.clientes?.nombre?.toLowerCase().includes(term) ||
      v.id.toLowerCase().includes(term) ||
      v.estado.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, ID o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total Venta</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Deuda</TableHead>
              <TableHead className="w-12 text-center">Orden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron ventas.
                </TableCell>
              </TableRow>
            ) : (
              filteredVentas.map((venta: any) => {
                const total = Number(venta.total) || 0;
                const pagado = venta.ledger?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;
                const deuda = Math.max(0, total - pagado);
                
                return (
                  <TableRow key={venta.id}>
                    <TableCell className="text-xs font-medium">
                      {format(new Date(venta.created_at), "dd/MM/yy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>{venta.clientes?.nombre || "Desconocido"}</TableCell>
                    <TableCell>
                      <Badge variant={venta.estado === "pagada" ? "default" : "secondary"} className="text-[10px] uppercase">
                        {venta.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${total.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-emerald-600">${pagado.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-amber-600 font-bold">${deuda.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {venta.orden_id ? (
                        <Link href={`/orden_y_colas/${venta.orden_id}?tab=venta`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}