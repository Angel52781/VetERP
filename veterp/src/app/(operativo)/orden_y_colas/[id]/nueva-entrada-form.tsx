"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [texto, setTexto] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!texto.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createEntradaClinica({
        orden_id: ordenId,
        tipo_text: "Evolución u observación",
        texto_text: texto,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setTexto("");
        router.refresh();
      }
    } catch {
      setError("Error inesperado al guardar la evolución u observación.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Agregar nota adicional de la visita</CardTitle>
        <CardDescription>
          Úsala para observaciones nuevas durante esta atención. Para corregir el registro principal, usa Editar con auditoría.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nota-adicional-texto">Detalle</Label>
            <Textarea
              id="nota-adicional-texto"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder="Escribe la evolución, observación o indicación adicional..."
              className="min-h-[100px]"
              required
            />
          </div>

          {error ? <div className="text-sm text-red-500">{error}</div> : null}

          <Button type="submit" disabled={isLoading || !texto.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar nota adicional
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
