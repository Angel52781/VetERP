"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignosVitalesInput, signosVitalesSchema } from "@/lib/validators/atencion";
import { createEntradaClinica } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface SignosVitalesFormProps {
  ordenId: string;
  entradas: any[];
}

export function SignosVitalesForm({ ordenId, entradas }: SignosVitalesFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar si ya hay una nota clínica principal estructurada (SOAP)
  const notaPrincipal = entradas.find(e => e.tipo_text === "Nota Clínica de Evolución" || e.tipo_text === "Signos Vitales y Triaje");

  const form = useForm<SignosVitalesInput>({
    resolver: zodResolver(signosVitalesSchema),
    defaultValues: {
      orden_id: ordenId,
      motivo_consulta_text: (notaPrincipal?.motivo_consulta_text as string) || "",
      anamnesis_text: (notaPrincipal?.anamnesis_text as string) || "",
      peso_kg_num: notaPrincipal?.peso_kg_num ? Number(notaPrincipal.peso_kg_num) : undefined,
      temperatura_c_num: notaPrincipal?.temperatura_c_num ? Number(notaPrincipal.temperatura_c_num) : undefined,
      frecuencia_cardiaca_num: notaPrincipal?.frecuencia_cardiaca_num ? Number(notaPrincipal.frecuencia_cardiaca_num) : undefined,
      frecuencia_respiratoria_num: notaPrincipal?.frecuencia_respiratoria_num ? Number(notaPrincipal.frecuencia_respiratoria_num) : undefined,
      observaciones_text: (notaPrincipal?.observaciones_text as string) || "",
      diagnostico_text: (notaPrincipal?.diagnostico_text as string) || "",
      plan_tratamiento_text: (notaPrincipal?.plan_tratamiento_text as string) || "",
    },
  });

  async function onSubmit(data: SignosVitalesInput) {
    setIsSubmitting(true);
    const result = await createEntradaClinica({
      orden_id: ordenId,
      tipo_text: "Nota Clínica de Evolución",
      texto_text: "Registro médico estructurado (SOAP)",
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
      toast.success(notaPrincipal ? "Expediente actualizado" : "Expediente registrado");
      router.refresh();
    }
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Expediente Clínico
        </CardTitle>
        <CardDescription>Registre la historia clínica, signos vitales, examen físico, diagnóstico y plan de tratamiento (Formato SOAP).</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* BLOQUE S (SUBJETIVO) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">Motivo y Anamnesis</h3>
              <FormField
                control={form.control}
                name="motivo_consulta_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de Consulta (Principal)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Vómitos desde hace 2 días, decaimiento" {...field} />
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
                    <FormLabel>Historia Clínica Actual / Entorno</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripcion detallada proporcionada por el responsable: inicio de sintomas, dieta, cambios recientes..." 
                        className="resize-none h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* BLOQUE O (OBJETIVO) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">Signos Vitales y Examen Físico</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="peso_kg_num"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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
                        <Input type="number" step="0.1" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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
                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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
                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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
                    <FormLabel>Hallazgos del Examen Físico</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mucosas, tiempo de llenado capilar, palpación abdominal, auscultación..." 
                        className="resize-none h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* BLOQUE A y P (DIAGNÓSTICO Y PLAN) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">Diagnóstico y Plan</h3>
              <FormField
                control={form.control}
                name="diagnostico_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico o Impresión Clínica</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Gastroenteritis aguda secundaria a indiscreción dietética" {...field} />
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
                    <FormLabel>Plan de Tratamiento y Recomendaciones</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Medicamentos recetados, indicaciones de dieta, exámenes de laboratorio sugeridos, control en 48 horas..." 
                        className="resize-none h-24"
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
                {notaPrincipal ? "Actualizar Expediente" : "Guardar Expediente Clínico"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
