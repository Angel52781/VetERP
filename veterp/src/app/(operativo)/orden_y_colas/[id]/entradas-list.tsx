"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EntradaClinica {
  id: string;
  tipo_text: string;
  texto_text: string;
  fecha_date: string;
  created_at: string;
}

interface EntradasListProps {
  entradas: EntradaClinica[];
}

export function EntradasList({ entradas }: EntradasListProps) {
  if (!entradas || entradas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay notas clínicas registradas aún.
      </div>
    );
  }

  // Sort by date descending
  const sortedEntradas = [...entradas].sort(
    (a, b) => new Date(b.fecha_date).getTime() - new Date(a.fecha_date).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEntradas.map((entrada) => (
        <Card key={entrada.id}>
          <CardHeader className="py-3 bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                {entrada.tipo_text}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entrada.fecha_date), "dd/MM/yyyy HH:mm", { locale: es })}
              </span>
            </div>
          </CardHeader>
          <CardContent className="py-4 whitespace-pre-wrap text-sm">
            {entrada.texto_text}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
