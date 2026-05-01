"use client";

import { useState } from "react";
import { format, addDays, isBefore, isAfter, startOfDay, parseISO } from "date-fns";
import { 
  Plus, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seguimientoClinicoSchema, type SeguimientoClinicoInput } from "@/lib/validators/seguimiento";
import { createSeguimientoClinico } from "@/app/(operativo)/mascotas/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Seguimiento {
  id: string;
  tipo_text: "vacuna" | "control";
  nombre_text: string;
  fecha_aplicacion_date: string;
  proxima_fecha_date: string | null;
  notas_text: string | null;
  created_at: string;
}

interface SeguimientosCardProps {
  mascotaId: string;
  ordenId?: string;
  seguimientos: Seguimiento[];
  featureUnavailable?: boolean;
  featureUnavailableReason?: string;
}

export function SeguimientosCard({
  mascotaId,
  ordenId,
  seguimientos,
  featureUnavailable = false,
  featureUnavailableReason,
}: SeguimientosCardProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const now = startOfDay(new Date());

  const getStatus = (proximaFecha: string | null) => {
    if (!proximaFecha) return { label: "Al día", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 };
    
    const date = parseISO(proximaFecha);
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isBefore(date, now)) {
      return { label: "Vencido", color: "bg-red-100 text-red-800", icon: AlertCircle };
    }
    if (diffDays <= 7) {
      return { label: `Próximo (${diffDays}d)`, color: "bg-orange-100 text-orange-800", icon: Clock };
    }
    if (diffDays <= 30) {
      return { label: "Próximo (30d)", color: "bg-blue-100 text-blue-800", icon: Calendar };
    }
    return { label: "Al día", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 };
  };

  // Resumen
  const vencidos = seguimientos.filter(s => s.proxima_fecha_date && isBefore(parseISO(s.proxima_fecha_date), now));
  const proximos7 = seguimientos.filter(s => {
    if (!s.proxima_fecha_date) return false;
    const date = parseISO(s.proxima_fecha_date);
    return !isBefore(date, now) && isBefore(date, addDays(now, 8));
  });

  return (
    <div className="space-y-6">
      {/* Resumen de Vencimientos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={vencidos.length > 0 ? "border-red-100 bg-red-50/30" : "bg-muted/10 border-muted"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${vencidos.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>Vencidos</p>
                <p className={`text-2xl font-bold ${vencidos.length > 0 ? "text-red-700" : "text-foreground"}`}>{vencidos.length}</p>
              </div>
              <AlertCircle className={`h-8 w-8 ${vencidos.length > 0 ? "text-red-400" : "text-muted-foreground/40"}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={proximos7.length > 0 ? "border-orange-100 bg-orange-50/30" : "bg-muted/10 border-muted"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${proximos7.length > 0 ? "text-orange-600" : "text-muted-foreground"}`}>Próximos 7 días</p>
                <p className={`text-2xl font-bold ${proximos7.length > 0 ? "text-orange-700" : "text-foreground"}`}>{proximos7.length}</p>
              </div>
              <Clock className={`h-8 w-8 ${proximos7.length > 0 ? "text-orange-400" : "text-muted-foreground/40"}`} />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="w-full h-full min-h-[80px] gap-2" size="lg" disabled={featureUnavailable}>
                  <Plus className="h-5 w-5" />
                  {featureUnavailable ? "Seguimientos no disponible" : "Nuevo Seguimiento"}
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Seguimiento</DialogTitle>
              </DialogHeader>
              <SeguimientoForm 
                mascotaId={mascotaId} 
                ordenId={ordenId}
                featureUnavailable={featureUnavailable}
                onSuccess={() => {
                  setOpen(false);
                  router.refresh();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Historial de Seguimientos
          </CardTitle>
          <CardDescription>
            Registro cronológico de vacunas y controles preventivos.
          </CardDescription>
          {featureUnavailable && (
            <CardDescription className="text-amber-700">
              {featureUnavailableReason ?? "Seguimientos clínicos no disponible todavía. Aplica la migración `0013_seguimientos_clinicos.sql`."}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {seguimientos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <ShieldCheck className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p>No hay seguimientos registrados aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {seguimientos.map((s) => {
                const status = getStatus(s.proxima_fecha_date);
                const StatusIcon = status.icon;
                
                return (
                  <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${s.tipo_text === 'vacuna' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {s.tipo_text === 'vacuna' ? <ShieldCheck className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{s.nombre_text}</h4>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0">
                            {s.tipo_text}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Aplicado: {format(parseISO(s.fecha_aplicacion_date), "dd/MM/yyyy")}
                          </span>
                          {s.proxima_fecha_date && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Calendar className="h-3 w-3" />
                              Próximo: {format(parseISO(s.proxima_fecha_date), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`${status.color} border-none flex items-center gap-1 px-2`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SeguimientoForm({
  mascotaId,
  ordenId,
  featureUnavailable,
  onSuccess,
}: {
  mascotaId: string;
  ordenId?: string;
  featureUnavailable: boolean;
  onSuccess: () => void;
}) {
  const form = useForm<SeguimientoClinicoInput>({
    resolver: zodResolver(seguimientoClinicoSchema),
    defaultValues: {
      mascota_id: mascotaId,
      orden_id: ordenId,
      tipo_text: "vacuna",
      nombre_text: "",
      fecha_aplicacion_date: format(new Date(), "yyyy-MM-dd"),
      proxima_fecha_date: "",
      notas_text: "",
    },
  });

  const onSubmit = async (values: SeguimientoClinicoInput) => {
    if (featureUnavailable) {
      toast.error("Seguimientos clínicos no disponible: aplica la migración 0013.");
      return;
    }

    // Limpiar fecha próxima si está vacía
    const payload = {
      ...values,
      proxima_fecha_date: values.proxima_fecha_date || undefined,
    };
    
    const result = await createSeguimientoClinico(payload);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Seguimiento registrado correctamente");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vacuna">Vacuna</SelectItem>
                  <SelectItem value="control">Control / Refuerzo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="nombre_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre (ej. Sextuple, Rabia, Control)</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del seguimiento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fecha_aplicacion_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Aplicación</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="proxima_fecha_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Próxima Fecha (Opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notas_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observaciones adicionales..." 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Guardando..." : "Guardar Seguimiento"}
        </Button>
      </form>
    </Form>
  );
}
