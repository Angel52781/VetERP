"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEntradaClinica } from "./actions";
import { Loader2 } from "lucide-react";

interface NuevaEntradaFormProps {
  ordenId: string;
}

export function NuevaEntradaForm({ ordenId }: NuevaEntradaFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState("Evolución");
  const [texto, setTexto] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createEntradaClinica({
        orden_id: ordenId,
        tipo_text: tipo,
        texto_text: texto,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setTipo("Evolución");
        setTexto("");
        router.refresh(); // Refresh page to show new entry
      }
    } catch (err) {
      setError("Error inesperado al guardar la nota.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Nueva Nota Clínica</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de nota</Label>
            <Input
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej: Evolución, Anamnesis, Examen Físico"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="texto">Detalle</Label>
            <Textarea
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escriba los detalles aquí..."
              className="min-h-[100px]"
              required
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <Button type="submit" disabled={isLoading || !texto.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Nota
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
