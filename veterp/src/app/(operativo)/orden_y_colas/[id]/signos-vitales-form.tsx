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
import { Loader2, Activity } from "lucide-react";
import { toast } from "sonner";

interface SignosVitalesFormProps {
  ordenId: string;
  entradas: any[];
}

export function SignosVitalesForm({ ordenId, entradas }: SignosVitalesFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar si ya hay signos capturados en esta orden
  const signosPrevios = entradas.find(e => e.tipo_text === "Signos Vitales y Triaje");

  const form = useForm<SignosVitalesInput>({
    resolver: zodResolver(signosVitalesSchema),
    defaultValues: {
      orden_id: ordenId,
      motivo_consulta_text: (signosPrevios?.motivo_consulta_text as string) || "",
      peso_kg_num: signosPrevios?.peso_kg_num ? Number(signosPrevios.peso_kg_num) : undefined,
      temperatura_c_num: signosPrevios?.temperatura_c_num ? Number(signosPrevios.temperatura_c_num) : undefined,
      frecuencia_cardiaca_num: signosPrevios?.frecuencia_cardiaca_num ? Number(signosPrevios.frecuencia_cardiaca_num) : undefined,
      frecuencia_respiratoria_num: signosPrevios?.frecuencia_respiratoria_num ? Number(signosPrevios.frecuencia_respiratoria_num) : undefined,
      observaciones_text: (signosPrevios?.observaciones_text as string) || "",
      diagnostico_text: (signosPrevios?.diagnostico_text as string) || "",
    },
  });

  async function onSubmit(data: SignosVitalesInput) {
    setIsSubmitting(true);
    const result = await createEntradaClinica({
      orden_id: ordenId,
      tipo_text: "Signos Vitales y Triaje",
      texto_text: "Registro estructurado de signos vitales", // Texto plano requerido por retrocompatibilidad
      motivo_consulta_text: data.motivo_consulta_text,
      peso_kg_num: data.peso_kg_num,
      temperatura_c_num: data.temperatura_c_num,
      frecuencia_cardiaca_num: data.frecuencia_cardiaca_num,
      frecuencia_respiratoria_num: data.frecuencia_respiratoria_num,
      observaciones_text: data.observaciones_text,
      diagnostico_text: data.diagnostico_text,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(signosPrevios ? "Signos vitales actualizados" : "Signos vitales registrados");
      router.refresh();
    }
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Captura Clínica Rápida
        </CardTitle>
        <CardDescription>Registre los signos vitales e impresión clínica inicial del paciente.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="motivo_consulta_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de Consulta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Vómitos desde hace 2 días" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Observaciones Clínicas (Examen Físico)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mucosas, tiempo de llenado capilar, palpación abdominal..." 
                      className="resize-none h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostico_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico o Impresión Clínica</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Gastroenteritis aguda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {signosPrevios ? "Actualizar Signos" : "Guardar Signos"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
