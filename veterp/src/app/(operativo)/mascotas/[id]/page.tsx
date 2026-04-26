import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { getMascotaCompleta } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Clock, Calendar, Activity, ClipboardList, Stethoscope } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MascotaProfilePage({ params }: PageProps) {
  const { id } = await params;
  const { mascota, ordenes, citas, error } = await getMascotaCompleta(id);

  if (error || !mascota) {
    notFound();
  }

  const now = new Date();
  const nextCita = citas?.find(c => new Date(c.start_date) > now && c.estado !== "cancelada");
  const lastOrden = ordenes?.[0]; 
  const ageString = mascota.nacimiento 
    ? `${Math.floor((now.getTime() - new Date(mascota.nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} años`
    : "Edad desconocida";

  const allEntradas = ordenes?.flatMap(o => o.entradas_clinicas || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{mascota.nombre}</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {mascota.especie}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Tutor: <Link href={`/clientes/${mascota.cliente_id}`} className="hover:underline text-foreground font-medium">{mascota.clientes?.nombre}</Link>
          </p>
        </div>
        <Link href={`/index?clienteId=${mascota.cliente_id}&mascotaId=${mascota.id}`} className={buttonVariants()}>
          <Stethoscope className="mr-2 h-4 w-4" />
          Nueva Atención
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" /> Raza / Edad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{mascota.raza || "Mestizo"}</div>
            <div className="text-xs text-muted-foreground">{ageString}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <ClipboardList className="h-4 w-4" /> Historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{ordenes?.length || 0} visitas</div>
            <div className="text-xs text-muted-foreground">{allEntradas.length} notas clínicas</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Última Visita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastOrden ? (
              <>
                <div className="font-semibold">{format(new Date(lastOrden.created_at), "dd/MM/yyyy", { locale: es })}</div>
                <Link href={`/orden_y_colas/${lastOrden.id}`} className="text-xs text-blue-600 hover:underline">
                  Ver orden {lastOrden.estado_text === "open" || lastOrden.estado_text === "in_progress" ? "(Activa)" : ""}
                </Link>
              </>
            ) : (
              <div className="font-semibold text-muted-foreground">Sin visitas</div>
            )}
          </CardContent>
        </Card>

        <Card className={nextCita ? "border-primary/50 bg-primary/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" /> Próxima Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextCita ? (
              <>
                <div className="font-semibold text-primary">{format(new Date(nextCita.start_date), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                <div className="text-xs text-muted-foreground">{(nextCita.tipo_citas as any)?.nombre}</div>
              </>
            ) : (
              <div className="font-semibold text-muted-foreground">No programada</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="historia" className="w-full">
        <TabsList>
          <TabsTrigger value="historia">Historia Clínica</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes de Servicio</TabsTrigger>
          <TabsTrigger value="citas">Citas Históricas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="historia" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolución Longitudinal</CardTitle>
              <CardDescription>Notas clínicas y observaciones acumuladas de todas las visitas de la mascota, ordenadas cronológicamente.</CardDescription>
            </CardHeader>
            <CardContent>
              {allEntradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/20">
                  Aún no hay registros clínicos para este paciente.
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {allEntradas.map((entrada) => (
                    <div key={entrada.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {entrada.motivo_consulta_text ? `Motivo: ${entrada.motivo_consulta_text}` : entrada.tipo_text}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            {format(new Date(entrada.created_at), "dd MMM, yyyy", { locale: es })}
                          </span>
                        </div>
                        
                        {(entrada.peso_kg_num || entrada.temperatura_c_num || entrada.frecuencia_cardiaca_num || entrada.frecuencia_respiratoria_num) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {entrada.peso_kg_num && <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/20">⚖️ {entrada.peso_kg_num} kg</span>}
                            {entrada.temperatura_c_num && <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/20">🌡️ {entrada.temperatura_c_num} °C</span>}
                            {entrada.frecuencia_cardiaca_num && <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/20">❤️ {entrada.frecuencia_cardiaca_num} lpm</span>}
                            {entrada.frecuencia_respiratoria_num && <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/20">🫁 {entrada.frecuencia_respiratoria_num} rpm</span>}
                          </div>
                        )}

                        {entrada.observaciones_text && (
                          <div className="mb-2">
                            <span className="text-xs font-semibold block text-muted-foreground mb-1">Examen Físico:</span>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{entrada.observaciones_text}</p>
                          </div>
                        )}
                        
                        {entrada.texto_text && entrada.tipo_text !== "Signos Vitales y Triaje" && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{entrada.texto_text}</p>
                        )}

                        {entrada.diagnostico_text && (
                          <div className="mt-3 pt-2 border-t border-dashed">
                            <span className="text-xs font-semibold block text-primary mb-1">Diagnóstico / Impresión Clínica:</span>
                            <p className="text-sm font-medium">{entrada.diagnostico_text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordenes" className="mt-6">
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
                      <Link href={`/orden_y_colas/${orden.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Ir a Orden
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay órdenes registradas para esta mascota.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Citas</CardTitle>
            </CardHeader>
            <CardContent>
              {citas && citas.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {citas.map(cita => (
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
                      <div className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${cita.estado === 'programada' ? 'bg-blue-100 text-blue-800' : cita.estado === 'completada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {cita.estado}
                      </div>
                    </div>
                  ))}
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
