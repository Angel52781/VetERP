"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Database } from "lucide-react";
import { seedFullDemoData } from "./seed-actions";

export function SeedDemoButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  async function handleSeed() {
    setLoading(true);
    setResults(null);
    const result = await seedFullDemoData();
    setLoading(false);

    if (result.success) {
      toast.success("Datos demo inyectados correctamente");
      setResults(result.counts);
    } else {
      toast.error(result.error || "Error al inyectar demo data");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cargar Datos de Prueba</h3>
          <p className="text-sm text-muted-foreground">
            Inyecta clientes, mascotas, citas, órdenes de servicio, catálogo y stock.
            Usa esto para poblar un entorno vacío y poder probar todas las áreas del ERP.
          </p>
        </div>
        <Button onClick={handleSeed} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
          Inyectar Demo Data
        </Button>
      </div>

      {results && (
        <div className="bg-muted/50 p-4 rounded-md border text-sm">
          <h4 className="font-semibold mb-2">Resultados de inserción:</h4>
          <ul className="grid grid-cols-2 gap-2">
            <li>Clientes: <strong>{results.clientes}</strong></li>
            <li>Mascotas: <strong>{results.mascotas}</strong></li>
            <li>Tipos de Cita: <strong>{results.tiposCita}</strong></li>
            <li>Citas: <strong>{results.citas}</strong></li>
            <li>Órdenes de Servicio: <strong>{results.ordenes}</strong></li>
            <li>Items Catálogo: <strong>{results.catalogo}</strong></li>
            <li>Movimientos Stock: <strong>{results.stock}</strong></li>
            <li>Ventas: <strong>{results.ventas}</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
}
