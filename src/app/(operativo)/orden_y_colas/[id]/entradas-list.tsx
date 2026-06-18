"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EditarEntradaClinicaDialog } from "./editar-entrada-clinica-dialog";

interface EntradaClinica {
  id: string;
  orden_id?: string;
  tipo_text: string | null;
  texto_text: string | null;
  motivo_consulta_text?: string | null;
  peso_kg_num?: number | string | null;
  temperatura_c_num?: number | string | null;
  frecuencia_cardiaca_num?: number | null;
  frecuencia_respiratoria_num?: number | null;
  observaciones_text?: string | null;
  diagnostico_text?: string | null;
  anamnesis_text?: string | null;
  plan_tratamiento_text?: string | null;
  fecha_date: string;
  created_at: string;
  editado_at?: string | null;
  editado_por?: string | null;
  ediciones_count?: number | null;
  entradas_clinicas_ediciones?: EntradaClinicaEdicion[];
}

interface EntradaClinicaEdicion {
  id: string;
  editado_por: string | null;
  motivo_text: string;
  created_at: string;
}

interface EntradasListProps {
  entradas: EntradaClinica[];
  canEdit?: boolean;
}

const MAIN_NOTE_TYPES = new Set(["Nota Clínica de Evolución", "Signos Vitales y Triaje"]);

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es });
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isMainNote(entrada: EntradaClinica) {
  return MAIN_NOTE_TYPES.has(entrada.tipo_text ?? "");
}

function formatNumber(value: unknown, suffix: string) {
  if (value === null || value === undefined || value === "") return null;
  return `${value} ${suffix}`;
}

function NoteField({ label, value }: { label: string; value: unknown }) {
  if (!hasText(value)) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{String(value)}</p>
    </div>
  );
}

function hasStructuredContent(entrada: EntradaClinica) {
  return Boolean(
    entrada.motivo_consulta_text ||
      entrada.anamnesis_text ||
      entrada.observaciones_text ||
      entrada.diagnostico_text ||
      entrada.plan_tratamiento_text ||
      entrada.peso_kg_num ||
      entrada.temperatura_c_num ||
      entrada.frecuencia_cardiaca_num ||
      entrada.frecuencia_respiratoria_num,
  );
}

function NoteBody({ entrada }: { entrada: EntradaClinica }) {
  const vitales = [
    formatNumber(entrada.peso_kg_num, "kg"),
    formatNumber(entrada.temperatura_c_num, "°C"),
    formatNumber(entrada.frecuencia_cardiaca_num, "lpm"),
    formatNumber(entrada.frecuencia_respiratoria_num, "rpm"),
  ].filter((value): value is string => Boolean(value));
  const shouldShowFreeText = !isMainNote(entrada) && hasText(entrada.texto_text);

  if (!hasStructuredContent(entrada) && !shouldShowFreeText) {
    return <p className="text-sm text-muted-foreground">Sin detalle registrado.</p>;
  }

  return (
    <>
      {shouldShowFreeText ? <p className="whitespace-pre-wrap">{entrada.texto_text}</p> : null}
      <NoteField label="Motivo de consulta" value={entrada.motivo_consulta_text} />
      <NoteField label="Anamnesis y antecedentes recientes" value={entrada.anamnesis_text} />
      {vitales.length ? (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Signos vitales</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {vitales.map((value) => (
              <span key={value} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {value}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <NoteField label="Examen físico y observaciones" value={entrada.observaciones_text} />
      <NoteField label="Diagnóstico o impresión clínica" value={entrada.diagnostico_text} />
      <NoteField label="Plan de tratamiento y recomendaciones" value={entrada.plan_tratamiento_text} />
    </>
  );
}

export function EntradasList({ entradas, canEdit = false }: EntradasListProps) {
  if (!entradas || entradas.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p className="text-sm font-medium text-foreground">Aún no hay notas adicionales en esta visita.</p>
        <p className="text-sm mt-1">El registro principal se guarda arriba. Usa esta sección solo si ocurre algo adicional durante la misma atención.</p>
      </div>
    );
  }

  const sortedEntradas = [...entradas].sort(
    (a, b) => new Date(b.fecha_date).getTime() - new Date(a.fecha_date).getTime(),
  );

  return (
    <div className="space-y-4">
      {sortedEntradas.map((entrada) => {
        const mainNote = isMainNote(entrada);

        return (
          <Card key={entrada.id}>
            <CardHeader className="bg-muted/30 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-sm font-medium">
                      {mainNote ? "Registro de atención" : "Nota adicional de la visita"}
                    </CardTitle>
                    {Number(entrada.ediciones_count ?? 0) > 0 ? (
                      <Badge className="border-none bg-amber-100 text-amber-900">Con cambios</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(entrada.fecha_date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    {entrada.editado_at ? <span>Último cambio: {formatDateTime(entrada.editado_at)}</span> : null}
                  </div>
                </div>
                {canEdit ? <EditarEntradaClinicaDialog entrada={entrada} /> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 py-4 text-sm">
              <NoteBody entrada={entrada} />

              {entrada.entradas_clinicas_ediciones?.length ? (
                <div className="rounded-lg border border-dashed p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Historial de cambios
                  </p>
                  <div className="mt-2 space-y-2">
                    {[...entrada.entradas_clinicas_ediciones]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((edicion) => (
                        <div key={edicion.id} className="rounded-md bg-muted/30 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(edicion.created_at)} - Usuario registrado
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{edicion.motivo_text}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
