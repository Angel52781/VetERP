"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignosVitalesInput, signosVitalesSchema } from "@/lib/validators/atencion";
import { createEntradaClinica } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { EditarEntradaClinicaDialog } from "./editar-entrada-clinica-dialog";

interface SignosVitalesFormProps {
  ordenId: string;
  entradas: ClinicalNoteEntry[];
  canEditEntradas?: boolean;
}

type ClinicalNoteEntry = {
  id: string;
  tipo_text?: string | null;
  texto_text?: string | null;
  motivo_consulta_text?: string | null;
  peso_kg_num?: number | string | null;
  temperatura_c_num?: number | string | null;
  frecuencia_cardiaca_num?: number | null;
  frecuencia_respiratoria_num?: number | null;
  observaciones_text?: string | null;
  diagnostico_text?: string | null;
  anamnesis_text?: string | null;
  plan_tratamiento_text?: string | null;
};

const MAIN_NOTE_TYPES = new Set(["Nota Clínica de Evolución", "Signos Vitales y Triaje"]);

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatNumber(value: unknown, suffix: string) {
  if (value === null || value === undefined || value === "") return null;
  return `${value} ${suffix}`;
}

function ReadOnlySection({ label, value }: { label: string; value: unknown }) {
  if (!hasText(value)) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-sm">{String(value)}</p>
    </div>
  );
}

function NoteSummary({ notaPrincipal }: { notaPrincipal: ClinicalNoteEntry }) {
  const vitales = [
    formatNumber(notaPrincipal.peso_kg_num, "kg"),
    formatNumber(notaPrincipal.temperatura_c_num, "°C"),
    formatNumber(notaPrincipal.frecuencia_cardiaca_num, "lpm"),
    formatNumber(notaPrincipal.frecuencia_respiratoria_num, "rpm"),
  ].filter((value): value is string => Boolean(value));

  return (
    <div className="space-y-4">
      <ReadOnlySection label="Motivo de consulta" value={notaPrincipal.motivo_consulta_text} />
      <ReadOnlySection label="Anamnesis y antecedentes recientes" value={notaPrincipal.anamnesis_text} />

      {vitales.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signos vitales</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {vitales.map((value) => (
              <span key={value} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {value}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <ReadOnlySection label="Examen físico y observaciones" value={notaPrincipal.observaciones_text} />
      <ReadOnlySection label="Diagnóstico o impresión clínica" value={notaPrincipal.diagnostico_text} />
      <ReadOnlySection label="Plan de tratamiento y recomendaciones" value={notaPrincipal.plan_tratamiento_text} />
    </div>
  );
}

export function SignosVitalesForm({ ordenId, entradas, canEditEntradas = false }: SignosVitalesFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notaPrincipal = entradas.find((entrada) => MAIN_NOTE_TYPES.has(entrada.tipo_text ?? ""));

  const form = useForm<SignosVitalesInput>({
    resolver: zodResolver(signosVitalesSchema),
    defaultValues: {
      orden_id: ordenId,
      motivo_consulta_text: "",
      anamnesis_text: "",
      peso_kg_num: undefined,
      temperatura_c_num: undefined,
      frecuencia_cardiaca_num: undefined,
      frecuencia_respiratoria_num: undefined,
      observaciones_text: "",
      diagnostico_text: "",
      plan_tratamiento_text: "",
    },
  });

  async function onSubmit(data: SignosVitalesInput) {
    if (notaPrincipal) {
      toast.error("Esta atención ya tiene un registro de atención guardado. Para corregirlo, usa Editar con auditoría.");
      return;
    }

    setIsSubmitting(true);
    const result = await createEntradaClinica({
      orden_id: ordenId,
      tipo_text: "Nota Clínica de Evolución",
      texto_text: "Registro médico estructurado",
      motivo_consulta_text: data.motivo_consulta_text,
      anamnesis_text: data.anamnesis_text,
      peso_kg_num: data.peso_kg_num,
      temperatura_c_num: data.temperatura_c_num,
      frecuencia_cardiaca_num: data.frecuencia_cardiaca_num,
      frecuencia_respiratoria_num: data.frecuencia_respiratoria_num,
      observaciones_text: data.observaciones_text,
      diagnostico_text: data.diagnostico_text,
      plan_tratamiento_text: data.plan_tratamiento_text,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Registro de atención guardado");
      router.refresh();
    }
  }

  if (notaPrincipal) {
    return (
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Registro de atención
          </CardTitle>
          <CardDescription>Registro médico principal de esta atención clínica.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Esta atención ya tiene un registro de atención guardado. Para corregirlo, usa Editar con auditoría.
          </div>

          <NoteSummary notaPrincipal={notaPrincipal} />

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {canEditEntradas
                ? "Los cambios quedan registrados con motivo, fecha y usuario."
                : "Solo un administrador puede editar este registro de atención."}
            </p>
            {canEditEntradas ? <EditarEntradaClinicaDialog entrada={notaPrincipal} /> : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Stethoscope className="h-5 w-5 text-primary" />
          Registro de atención
        </CardTitle>
        <CardDescription>Registra la información médica de esta atención.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Motivo y anamnesis
              </h3>
              <FormField
                control={form.control}
                name="motivo_consulta_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de consulta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Vómitos desde hace 2 días, decaimiento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anamnesis_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anamnesis y antecedentes recientes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción proporcionada por el responsable: inicio de síntomas, dieta, cambios recientes..."
                        className="h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="border-b pb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Signos vitales y examen físico
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="peso_kg_num"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={999}
                          {...field}
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperatura_c_num"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temp (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={60}
                          {...field}
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frecuencia_cardiaca_num"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FC (lpm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          {...field}
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frecuencia_respiratoria_num"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FR (rpm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          {...field}
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observaciones_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hallazgos del examen físico</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mucosas, tiempo de llenado capilar, palpación abdominal, auscultación..."
                        className="h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="border-b pb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Diagnóstico y plan
              </h3>
              <FormField
                control={form.control}
                name="diagnostico_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico o impresión clínica</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Gastroenteritis aguda secundaria a indiscreción dietética" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plan_tratamiento_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan de tratamiento y recomendaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Medicamentos recetados, indicaciones de dieta, exámenes sugeridos, control en 48 horas..."
                        className="h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar registro de atención
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
