"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, FileText, Upload } from "lucide-react";
import { uploadAdjunto } from "./actions";

interface Adjunto {
  id: string;
  archivo_url: string;
  descripcion_text: string | null;
  fecha_date: string;
  created_at: string;
}

interface AdjuntosPanelProps {
  ordenId: string;
  adjuntos: Adjunto[];
}

export function AdjuntosPanel({ ordenId, adjuntos }: AdjuntosPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [descripcion, setDescripcion] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("descripcion", descripcion);

      const result = await uploadAdjunto(formData, ordenId);

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form
        setSelectedFile(null);
        setDescripcion("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subir Nuevo Adjunto</CardTitle>
          <CardDescription>Formatos permitidos: imágenes, PDF, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Resultados de laboratorio"
              />
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Subir Archivo
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Archivos Adjuntos ({adjuntos?.length || 0})</h3>
        
        {!adjuntos || adjuntos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
            No hay archivos adjuntos en esta orden.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adjuntos.map((adjunto) => (
              <Card key={adjunto.id} className="overflow-hidden">
                <div className="p-4 flex flex-col h-full justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate" title={adjunto.descripcion_text || "Documento adjunto"}>
                        {adjunto.descripcion_text || "Documento adjunto"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(adjunto.fecha_date), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <a 
                      href={adjunto.archivo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      <Paperclip className="mr-2 h-3 w-3" />
                      Ver Archivo
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
