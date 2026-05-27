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
  before_data?: unknown;
  after_data?: unknown;
  created_at: string;
}

interface EntradasListProps {
  entradas: EntradaClinica[];
  canEdit?: boolean;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es });
}

function formatUser(value: string | null | undefined) {
  if (!value) return "Usuario no registrado";
  return `Usuario ${value.slice(0, 8)}`;
}

function SnapshotDetails({ edicion }: { edicion: EntradaClinicaEdicion }) {
  if (!edicion.before_data && !edicion.after_data) return null;

  return (
    <details className="mt-2 rounded-md border bg-background p-2">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
        Ver snapshot before/after
      </summary>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-[11px]">
          {JSON.stringify(edicion.before_data ?? {}, null, 2)}
        </pre>
        <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-[11px]">
          {JSON.stringify(edicion.after_data ?? {}, null, 2)}
        </pre>
      </div>
    </details>
  );
}

export function EntradasList({ entradas, canEdit = false }: EntradasListProps) {
  const notasEvolucion = entradas.filter(e => e.tipo_text !== "Signos Vitales y Triaje");

  if (!notasEvolucion || notasEvolucion.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay notas clínicas registradas aún.
      </div>
    );
  }

  // Sort by date descending
  const sortedEntradas = [...notasEvolucion].sort(
    (a, b) => new Date(b.fecha_date).getTime() - new Date(a.fecha_date).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEntradas.map((entrada) => (
        <Card key={entrada.id}>
          <CardHeader className="py-3 bg-muted/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-medium">
                    {entrada.tipo_text}
                  </CardTitle>
                  {Number(entrada.ediciones_count ?? 0) > 0 ? (
                    <Badge className="bg-amber-100 text-amber-900 border-none">Editada</Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(entrada.fecha_date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  {entrada.editado_at ? (
                    <span>Ultima edicion: {formatDateTime(entrada.editado_at)}</span>
                  ) : null}
                </div>
              </div>
              {canEdit ? <EditarEntradaClinicaDialog entrada={entrada} /> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 py-4 text-sm">
            {entrada.texto_text ? (
              <p className="whitespace-pre-wrap">{entrada.texto_text}</p>
            ) : null}
            {entrada.anamnesis_text ? (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Anamnesis</p>
                <p className="mt-1 whitespace-pre-wrap">{entrada.anamnesis_text}</p>
              </div>
            ) : null}
            {entrada.observaciones_text ? (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Examen fisico</p>
                <p className="mt-1 whitespace-pre-wrap">{entrada.observaciones_text}</p>
              </div>
            ) : null}
            {entrada.diagnostico_text ? (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Diagnostico</p>
                <p className="mt-1 whitespace-pre-wrap">{entrada.diagnostico_text}</p>
              </div>
            ) : null}
            {entrada.plan_tratamiento_text ? (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Plan terapeutico</p>
                <p className="mt-1 whitespace-pre-wrap">{entrada.plan_tratamiento_text}</p>
              </div>
            ) : null}

            {entrada.entradas_clinicas_ediciones?.length ? (
              <div className="rounded-lg border border-dashed p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Historial de ediciones
                </p>
                <div className="mt-2 space-y-2">
                  {[...entrada.entradas_clinicas_ediciones]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((edicion) => (
                      <div key={edicion.id} className="rounded-md bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(edicion.created_at)} - {formatUser(edicion.editado_por)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{edicion.motivo_text}</p>
                        <SnapshotDetails edicion={edicion} />
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
