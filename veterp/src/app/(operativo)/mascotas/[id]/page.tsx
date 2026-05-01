import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { BtnNuevaAtencion } from "./btn-nueva-atencion";
import { getMascotaCompleta } from "./actions";
import { SeguimientosCard } from "./seguimientos-card";
import { MascotaEditDialog } from "./mascota-edit-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Clock, Calendar, Activity, ClipboardList, Stethoscope, FileText, ArrowLeft } from "lucide-react";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";

const CITA_ESTADO_META: Record<string, { label: string; className: string }> = {
  programada: { label: "Programada", className: "bg-blue-100 text-blue-800" },
  confirmada: { label: "Confirmada", className: "bg-indigo-100 text-indigo-800" },
  llego: { label: "Llegó", className: "bg-amber-100 text-amber-800" },
  en_atencion: { label: "En atención", className: "bg-purple-100 text-purple-800" },
  completada: { label: "Completada", className: "bg-green-100 text-green-800" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-800" },
  no_asistio: { label: "No asistió", className: "bg-orange-100 text-orange-800" },
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    tab?: string;
  }>;
}

export default async function MascotaProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { returnTo, tab } = (await searchParams) ?? {};
  const { mascota, ordenes, citas, seguimientos, seguimientoFeatureUnavailable, seguimientoFeatureReason, error } = await getMascotaCompleta(id);

  if (!mascota) {
    notFound();
  }

  const now = new Date();
  const nextCita = citas?.find(
    (c) => new Date(c.start_date) > now && !["cancelada", "no_asistio", "completada"].includes(c.estado)
  );
  const lastOrden = ordenes?.[0]; 
  const activeOrden = ordenes?.find((orden) => ["open", "in_progress"].includes(orden.estado_text));
  const ageString = mascota.nacimiento 
    ? `${Math.floor((now.getTime() - new Date(mascota.nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} años`
    : "Edad desconocida";

  const rawEntradas = ordenes?.flatMap(o => o.entradas_clinicas || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
  
  // Filtrar notas SOAP duplicadas por la misma orden (solo mantenemos la más reciente)
  const soapOrdersSeen = new Set<string>();
  const allEntradas = rawEntradas.filter((entrada: any) => {
    const isSOAP = entrada.tipo_text === "Nota Clínica de Evolución" || entrada.tipo_text === "Signos Vitales y Triaje";
    if (isSOAP) {
      if (soapOrdersSeen.has(entrada.orden_id)) {
        return false;
      }
      soapOrdersSeen.add(entrada.orden_id);
    }
    return true;
  });
  
  // Buscar el último diagnóstico registrado válido
  const ultimoDiagnostico = allEntradas.find(e => e.diagnostico_text && e.diagnostico_text.trim().length > 0)?.diagnostico_text;
  const safeReturnTo = typeof returnTo === "string" && returnTo.startsWith("/")
    ? returnTo
    : `/clientes/${mascota.cliente_id}`;
  const ordenReturnTo = encodeURIComponent(safeReturnTo);
  const defaultTab = tab === "seguimientos" ? "seguimientos" : "historia";
  const seguimientosHref = `/mascotas/${id}?tab=seguimientos&returnTo=${encodeURIComponent(safeReturnTo)}`;

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      <div className="flex items-center">
        <Link href={safeReturnTo} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{mascota.nombre}</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {formatSpeciesLabel(mascota.especie)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Responsable: <Link href={`/clientes/${mascota.cliente_id}`} className="hover:underline text-foreground font-medium">{mascota.clientes?.nombre}</Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={seguimientosHref} className={buttonVariants({ variant: "outline" })}>
            Seguimientos
          </Link>
          <MascotaEditDialog mascota={mascota} />
          <BtnNuevaAtencion clienteId={mascota.cliente_id} mascotaId={mascota.id} />
        </div>
      </div>

      {/* Resumen Clínico Rápido */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-muted/10 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" /> Perfil Básico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{formatBreedLabel(mascota.raza)}</div>
            <div className="text-xs text-muted-foreground mt-1">{ageString}</div>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <ClipboardList className="h-4 w-4 text-primary" /> Último Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimoDiagnostico ? (
              <div className="font-medium text-sm text-primary line-clamp-2" title={ultimoDiagnostico}>
                {ultimoDiagnostico}
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground">Sin diagnósticos</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" /> Última Visita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastOrden ? (
              <>
                <div className="font-semibold">{format(new Date(lastOrden.created_at), "dd/MM/yyyy", { locale: es })}</div>
                <Link
                  href={`/orden_y_colas/${lastOrden.id}?returnTo=${ordenReturnTo}`}
                  className="text-xs text-blue-600 hover:underline inline-flex items-center mt-1"
                >
                  Ver expediente {lastOrden.estado_text === "open" || lastOrden.estado_text === "in_progress" ? "(Activa)" : ""}
                </Link>
              </>
            ) : (
              <div className="font-semibold text-muted-foreground">Sin visitas</div>
            )}
          </CardContent>
        </Card>

        <Card className={nextCita ? "border-primary/50 bg-primary/5 shadow-sm" : "bg-muted/10 border-muted"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" /> Próxima Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextCita ? (
              <>
                <div className="font-semibold text-primary">{format(new Date(nextCita.start_date), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                <div className="text-xs text-muted-foreground mt-1">{(nextCita.tipo_citas as any)?.nombre}</div>
              </>
            ) : (
              <div className="font-semibold text-muted-foreground">No programada</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="historia">Historial Médico Longitudinal</TabsTrigger>
          <TabsTrigger value="seguimientos">Seguimientos y Vencimientos</TabsTrigger>
          <TabsTrigger value="ordenes">Atenciones y Facturación</TabsTrigger>
          <TabsTrigger value="citas">Citas Programadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="seguimientos">
          <SeguimientosCard
            mascotaId={id}
            seguimientos={seguimientos || []}
            featureUnavailable={seguimientoFeatureUnavailable}
            featureUnavailableReason={seguimientoFeatureReason ?? undefined}
          />
        </TabsContent>

        <TabsContent value="historia">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              {allEntradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-card shadow-sm">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>Aún no hay registros clínicos para este paciente.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allEntradas.map((entrada) => {
                    // Validar si es una nota estructurada (SOAP) o nota libre
                    const isSOAP = entrada.tipo_text === "Nota Clínica de Evolución" || entrada.tipo_text === "Signos Vitales y Triaje";
                    
                    return (
                      <Card key={entrada.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow transition-shadow">
                        <div className="bg-muted/40 px-4 py-3 border-b flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground">
                              {entrada.motivo_consulta_text ? `Consulta: ${entrada.motivo_consulta_text}` : entrada.tipo_text}
                            </h3>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border shadow-sm">
                            {format(new Date(entrada.created_at), "dd MMMM, yyyy - HH:mm", { locale: es })}
                          </span>
                        </div>
                        
                        <CardContent className="p-5">
                          {/* Signos Vitales (Badge Strip) */}
                          {(entrada.peso_kg_num || entrada.temperatura_c_num || entrada.frecuencia_cardiaca_num || entrada.frecuencia_respiratoria_num) && (
                            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-dashed">
                              {entrada.peso_kg_num && <span className="inline-flex items-center rounded-md bg-secondary/30 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/50">⚖️ Peso: {entrada.peso_kg_num} kg</span>}
                              {entrada.temperatura_c_num && <span className="inline-flex items-center rounded-md bg-secondary/30 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/50">🌡️ Temp: {entrada.temperatura_c_num} °C</span>}
                              {entrada.frecuencia_cardiaca_num && <span className="inline-flex items-center rounded-md bg-secondary/30 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/50">❤️ FC: {entrada.frecuencia_cardiaca_num} lpm</span>}
                              {entrada.frecuencia_respiratoria_num && <span className="inline-flex items-center rounded-md bg-secondary/30 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/50">🫁 FR: {entrada.frecuencia_respiratoria_num} rpm</span>}
                            </div>
                          )}

                          {isSOAP ? (
                            <div className="space-y-4">
                              {entrada.anamnesis_text && (
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Historia Actual (Anamnesis)</span>
                                  <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-md border border-border/40">{entrada.anamnesis_text}</p>
                                </div>
                              )}
                              {entrada.observaciones_text && (
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Examen Físico</span>
                                  <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-md border border-border/40">{entrada.observaciones_text}</p>
                                </div>
                              )}
                              {entrada.diagnostico_text && (
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Diagnóstico / Impresión Clínica</span>
                                  <p className="text-sm font-medium text-primary bg-primary/5 p-3 rounded-md border border-primary/20">{entrada.diagnostico_text}</p>
                                </div>
                              )}
                              {entrada.plan_tratamiento_text && (
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Plan Terapéutico</span>
                                  <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-md border border-emerald-200 dark:border-emerald-900/50">{entrada.plan_tratamiento_text}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            // Nota libre (Legacy / Otros tipos)
                            entrada.texto_text && (
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Nota Evolutiva</span>
                                <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">{entrada.texto_text}</p>
                              </div>
                            )
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordenes">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Atenciones</CardTitle>
            </CardHeader>
            <CardContent>
              {ordenes && ordenes.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {ordenes.map(orden => (
                    <div key={orden.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          ORD-{orden.id.slice(0,8).toUpperCase()}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orden.estado_text === 'closed' ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-800'}`}>
                            {orden.estado_text === 'closed' ? 'Cerrada' : orden.estado_text === 'open' ? 'En Espera' : orden.estado_text === 'in_progress' ? 'En Atención' : 'Finalizada'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {orden.started_at ? format(new Date(orden.started_at), "dd/MM/yyyy HH:mm") : format(new Date(orden.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                      <Link href={`/orden_y_colas/${orden.id}?returnTo=${ordenReturnTo}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Ir a Orden
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay ordenes registradas para este paciente.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citas">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Citas</CardTitle>
            </CardHeader>
            <CardContent>
              {citas && citas.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {citas.map(cita => {
                    const estado = CITA_ESTADO_META[cita.estado] ?? CITA_ESTADO_META.programada;
                    return (
                    <div key={cita.id} className="flex items-center justify-between p-4 text-sm hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: (cita.tipo_citas as any)?.color || '#ccc' }}></div>
                        <div>
                          <div className="font-medium">{(cita.tipo_citas as any)?.nombre}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(cita.start_date), "dd MMMM yyyy, HH:mm", { locale: es })}
                          </div>
                        </div>
                      </div>
                      {cita.estado === "en_atencion" && activeOrden ? (
                        <Link
                          href={`/orden_y_colas/${activeOrden.id}?returnTo=${ordenReturnTo}`}
                          className={`text-xs px-2 py-1 rounded-full font-medium hover:underline ${estado.className}`}
                        >
                          {estado.label}
                        </Link>
                      ) : (
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${estado.className}`}>
                          {estado.label}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay citas registradas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
