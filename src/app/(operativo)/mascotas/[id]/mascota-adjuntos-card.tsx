"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, FileText, ImageIcon, Loader2, Paperclip, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MAX_MASCOTA_ADJUNTO_BYTES,
  MASCOTA_ADJUNTO_MIME_TYPES,
  tipoAdjuntoMascotaValues,
  type TipoAdjuntoMascota,
} from "@/lib/validators/adjuntos";
import { uploadMascotaAdjunto, type MascotaAdjunto } from "./actions";

const TIPO_ADJUNTO_LABELS: Record<TipoAdjuntoMascota, string> = {
  examen: "Examen",
  foto: "Foto",
  receta: "Receta",
  documento: "Documento",
  otro: "Otro",
};

const TIPO_ADJUNTO_BADGE: Record<TipoAdjuntoMascota, string> = {
  examen: "bg-blue-100 text-blue-800 border-none",
  foto: "bg-emerald-100 text-emerald-800 border-none",
  receta: "bg-purple-100 text-purple-800 border-none",
  documento: "bg-slate-100 text-slate-800 border-none",
  otro: "bg-muted text-muted-foreground border-none",
};

type TipoFilter = TipoAdjuntoMascota | "todos";

type MascotaAdjuntosCardProps = {
  mascotaId: string;
  adjuntos: MascotaAdjunto[];
  featureUnavailable?: boolean;
  featureUnavailableReason?: string;
};

function formatFileSize(sizeBytes: number | null) {
  if (!sizeBytes || sizeBytes <= 0) return "Tamano no registrado";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  return mimeType?.startsWith("image/") ? ImageIcon : FileText;
}

function validateClientFile(file: File | null) {
  if (!file) return "Selecciona un archivo.";
  const allowedMimeTypes: readonly string[] = MASCOTA_ADJUNTO_MIME_TYPES;
  if (!allowedMimeTypes.includes(file.type)) {
    return "Formato no permitido. Usa PDF, JPG, PNG o WEBP.";
  }
  if (file.size > MAX_MASCOTA_ADJUNTO_BYTES) {
    return "El archivo no debe superar 10MB.";
  }
  return null;
}

export function MascotaAdjuntosCard({
  mascotaId,
  adjuntos,
  featureUnavailable = false,
  featureUnavailableReason,
}: MascotaAdjuntosCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoText, setTipoText] = useState<TipoAdjuntoMascota>("examen");
  const [notasText, setNotasText] = useState("");
  const [filter, setFilter] = useState<TipoFilter>("todos");
  const [error, setError] = useState<string | null>(null);

  const filteredAdjuntos = useMemo(
    () => (filter === "todos" ? adjuntos : adjuntos.filter((adjunto) => adjunto.tipo_text === filter)),
    [adjuntos, filter],
  );

  const resetForm = () => {
    setSelectedFile(null);
    setTipoText("examen");
    setNotasText("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(validateClientFile(file));
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fileError = validateClientFile(selectedFile);
    if (fileError || !selectedFile) {
      setError(fileError);
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("mascota_id", mascotaId);
    formData.append("tipo_text", tipoText);
    formData.append("notas_text", notasText);
    formData.append("file", selectedFile);

    const result = await uploadMascotaAdjunto(formData);

    setIsUploading(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Adjunto subido correctamente");
    resetForm();
    setOpen(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            Adjuntos
            <Badge variant="secondary">{adjuntos.length}</Badge>
          </CardTitle>
          <CardDescription>Examenes, fotos, recetas y documentos clinicos del paciente.</CardDescription>
        </div>

        <Dialog open={open} onOpenChange={(nextOpen) => !isUploading && !featureUnavailable && setOpen(nextOpen)}>
          <DialogTrigger render={<Button size="sm" className="gap-2" disabled={featureUnavailable} />}>
            <Plus className="h-4 w-4" />
            Subir archivo
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Subir adjunto clinico</DialogTitle>
              <DialogDescription>PDF, JPG, PNG o WEBP. Maximo 10MB.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mascota-adjunto-file">Archivo</Label>
                <Input
                  id="mascota-adjunto-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mascota-adjunto-tipo">Tipo</Label>
                <Select value={tipoText} onValueChange={(value) => setTipoText(value as TipoAdjuntoMascota)}>
                  <SelectTrigger id="mascota-adjunto-tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoAdjuntoMascotaValues.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_ADJUNTO_LABELS[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mascota-adjunto-notas">Notas opcionales</Label>
                <Textarea
                  id="mascota-adjunto-notas"
                  value={notasText}
                  onChange={(event) => setNotasText(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Resultado, referencia o contexto clinico"
                />
              </div>

              {selectedFile ? (
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {selectedFile.name} - {formatFileSize(selectedFile.size)}
                </div>
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isUploading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUploading || !selectedFile || Boolean(error)}>
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Subir
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {featureUnavailable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {featureUnavailableReason ??
              "La tabla mascota_adjuntos no esta disponible; aplica migracion 0031 o recarga schema cache."}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{filteredAdjuntos.length} adjunto(s) visibles</p>
          <Select value={filter} onValueChange={(value) => setFilter(value as TipoFilter)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {tipoAdjuntoMascotaValues.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {TIPO_ADJUNTO_LABELS[tipo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {adjuntos.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            <Paperclip className="mx-auto h-8 w-8 opacity-30" />
            <p className="mt-2 text-sm">Todavia no hay adjuntos para este paciente.</p>
          </div>
        ) : filteredAdjuntos.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay adjuntos de este tipo.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredAdjuntos.map((adjunto) => {
              const Icon = getFileIcon(adjunto.mime_type_text);
              return (
                <div key={adjunto.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold" title={adjunto.nombre_archivo_text}>
                          {adjunto.nombre_archivo_text}
                        </p>
                        <Badge className={TIPO_ADJUNTO_BADGE[adjunto.tipo_text]}>
                          {TIPO_ADJUNTO_LABELS[adjunto.tipo_text]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(adjunto.created_at), "dd MMM yyyy, HH:mm", { locale: es })} -{" "}
                        {formatFileSize(adjunto.size_bytes)}
                      </p>
                      {adjunto.notas_text ? (
                        <p className="mt-2 whitespace-pre-wrap break-words rounded-md bg-muted/40 px-3 py-2 text-sm">
                          {adjunto.notas_text}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end border-t pt-3">
                    {adjunto.signed_url ? (
                      <a
                        href={adjunto.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                      >
                        <Download className="h-4 w-4" />
                        Ver / descargar
                      </a>
                    ) : (
                      <Button type="button" size="sm" variant="outline" disabled>
                        Enlace no disponible
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
