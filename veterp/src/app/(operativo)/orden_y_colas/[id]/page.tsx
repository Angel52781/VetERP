import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getOrdenCompleta } from "./actions";
import Link from "next/link";
import { getItemsCatalogo, getVentasDeOrden } from "@/app/(operativo)/caja_inventario/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EntradasList } from "./entradas-list";
import { NuevaEntradaForm } from "./nueva-entrada-form";
import { AdjuntosPanel } from "./adjuntos-panel";
import { VentaPanel } from "./venta-panel";
import { SignosVitalesForm } from "./signos-vitales-form";
import { ArrowLeft } from "lucide-react";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
import { getSeguimientosMascota } from "@/app/(operativo)/mascotas/[id]/actions";
import { SeguimientosCard } from "../../seguimientos-card";
import { AlertasCriticasBanner } from "@/components/alertas-criticas-banner";
import { getAgeFromDateOnly } from "@/lib/date-only";
import { getOrderFinancialStatus, getOrdenStatusMeta, getToneBadgeClass } from "@/lib/operational-status";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    tab?: string;
  }>;
}

export default async function OrdenDetailsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { returnTo, tab } = (await searchParams) ?? {};
  const [{ data: orden, error }, { data: itemsCatalogo }, { data: ventas }] = await Promise.all([
    getOrdenCompleta(id),
    getItemsCatalogo(),
    getVentasDeOrden(id)
  ]);

  if (error || !orden) {
    notFound();
  }

  const {
    seguimientos,
    seguimientoFeatureUnavailable,
    seguimientoFeatureReason,
  } = await getSeguimientosMascota(orden.mascota_id);

  const decodedReturnTo =
    typeof returnTo === "string"
      ? (() => {
          try {
            return decodeURIComponent(returnTo);
          } catch {
            return returnTo;
          }
        })()
      : undefined;
  const safeReturnTo =
    typeof decodedReturnTo === "string" && decodedReturnTo.startsWith("/")
      ? decodedReturnTo
      : "/atenciones";
  const normalizedTab = tab === "cobro" ? "venta" : tab;
  const allowedTabs = new Set(["resumen", "notas", "seguimientos", "adjuntos", "venta"]);
  const initialTab =
    typeof normalizedTab === "string" && allowedTabs.has(normalizedTab)
      ? normalizedTab
      : "resumen";
  const mascotaReturnTo = encodeURIComponent(
    `/orden_y_colas/${id}${decodedReturnTo ? `?returnTo=${encodeURIComponent(decodedReturnTo)}` : ""}`
  );
  const pacienteAge = getAgeFromDateOnly((orden.mascotas as any)?.nacimiento);
  const ordenStatusMeta = getOrdenStatusMeta(orden.estado_text);
  const ventaAbierta = (ventas || []).find((venta: any) => venta.estado === "abierta");
  const ventaPagada = (ventas || []).find((venta: any) => venta.estado === "pagada");
  const ventaActiva = ventaAbierta ?? ventaPagada ?? null;
  const totalVenta = Number(ventaActiva?.total ?? 0);
  const pagadoVenta = (ventaActiva?.ledger ?? [])
    .filter((mov: any) => mov.tipo === "pago")
    .reduce((acc: number, mov: any) => acc + Number(mov.monto), 0);
  const saldoPendiente = Math.max(0, totalVenta - pagadoVenta);
  const financialStatusMeta = getOrderFinancialStatus({
    ordenEstado: orden.estado_text,
    hasVenta: Boolean(ventaActiva?.id),
    ventaEstado: ventaActiva?.estado ?? null,
    saldoPendiente,
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-2 sm:py-4">
      <div className="mb-2">
        <Link href={safeReturnTo} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Orden de Servicio</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <p className="text-muted-foreground">Ref: ORD-{orden.id.slice(0, 8).toUpperCase()}</p>
            <span className="text-muted-foreground font-medium text-sm">•</span>
            <Link href={`/mascotas/${orden.mascota_id}?returnTo=${mascotaReturnTo}`} className="text-primary hover:underline font-medium text-sm">
              Paciente: {orden.mascotas?.nombre}
            </Link>
            {(orden.mascotas as any)?.codigo_text?.trim() ? (
              <>
                <span className="text-muted-foreground font-medium text-sm">â€¢</span>
                <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  #{(orden.mascotas as any).codigo_text}
                </span>
              </>
            ) : null}
            {orden.cliente_id ? (
              <>
                <span className="text-muted-foreground font-medium text-sm">•</span>
                <Link href={`/clientes/${orden.cliente_id}`} className="text-primary hover:underline font-medium text-sm">
                  Cliente: {orden.clientes?.nombre ?? "Responsable"}
                </Link>
              </>
            ) : null}
          </div>
          {orden.staff_member?.email ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Atendido por: <span className="font-medium text-foreground">{orden.staff_member.email}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-4 py-2 rounded-full font-medium text-sm ${getToneBadgeClass(ordenStatusMeta.tone)}`}>
            {ordenStatusMeta.label}
          </div>
          <div className={`px-4 py-2 rounded-full font-medium text-sm ${getToneBadgeClass(financialStatusMeta.tone)}`}>
            {financialStatusMeta.label}
          </div>
        </div>
      </div>

      {/* Alertas críticas del paciente */}
      <AlertasCriticasBanner alertas={(orden.mascotas as any)?.alertas_criticas} />

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="flex w-full min-w-0 overflow-x-auto sm:grid sm:grid-cols-5">
          <TabsTrigger value="resumen" className="min-w-[8.5rem] sm:min-w-0">Resumen</TabsTrigger>
          <TabsTrigger value="notas" className="min-w-[10rem] sm:min-w-0">Atención Clínica</TabsTrigger>
          <TabsTrigger value="seguimientos" className="min-w-[9rem] sm:min-w-0">Seguimientos</TabsTrigger>
          <TabsTrigger value="adjuntos" className="min-w-[8rem] sm:min-w-0">Adjuntos</TabsTrigger>
          <TabsTrigger value="venta" className="min-w-[7rem] sm:min-w-0">Cobro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resumen" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Responsable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <span className="font-medium text-muted-foreground">Nombre:</span>
                  <span className="font-medium sm:col-span-2">{orden.clientes?.nombre}</span>
                  
                  <span className="font-medium text-muted-foreground">Teléfono:</span>
                  <span className="sm:col-span-2">{orden.clientes?.telefono || "N/A"}</span>
                  
                  <span className="font-medium text-muted-foreground">Email:</span>
                  <span className="break-words sm:col-span-2">{orden.clientes?.email || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <span className="font-medium text-muted-foreground">Nombre:</span>
                  <span className="font-medium sm:col-span-2">
                    <Link href={`/mascotas/${orden.mascota_id}?returnTo=${mascotaReturnTo}`} className="text-primary hover:underline">
                      {orden.mascotas?.nombre}
                    </Link>
                  </span>

                  {(orden.mascotas as any)?.codigo_text?.trim() ? (
                    <>
                      <span className="font-medium text-muted-foreground">Código:</span>
                      <span className="sm:col-span-2">#{(orden.mascotas as any).codigo_text}</span>
                    </>
                  ) : null}
                  
                  <span className="font-medium text-muted-foreground">Especie:</span>
                  <span className="sm:col-span-2">{formatSpeciesLabel(orden.mascotas?.especie)}</span>
                  
                  <span className="font-medium text-muted-foreground">Raza:</span>
                  <span className="sm:col-span-2">{formatBreedLabel(orden.mascotas?.raza)}</span>

                  <span className="font-medium text-muted-foreground">Edad:</span>
                  <span className="sm:col-span-2">
                    {pacienteAge !== null ? `${pacienteAge} años` : "N/A"}
                  </span>
                </div>
                {(orden.mascotas as any)?.notas_manejo?.trim() && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Notas de manejo</p>
                    <p className="text-xs text-amber-800 whitespace-pre-wrap break-words">{(orden.mascotas as any).notas_manejo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Orden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <p className="font-medium text-muted-foreground">Fecha de creación</p>
                  <p>{format(new Date(orden.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Inicio atención</p>
                  <p>
                    {orden.started_at
                      ? format(new Date(orden.started_at), "dd/MM/yyyy HH:mm", { locale: es })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Atendido por</p>
                  <p>{orden.staff_member?.email || "No disponible"}</p>
                </div>
                {orden.finished_at && (
                  <div>
                    <p className="font-medium text-muted-foreground">Cierre</p>
                    <p>{format(new Date(orden.finished_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notas" className="mt-6 space-y-6">
          <SignosVitalesForm ordenId={id} entradas={orden.entradas_clinicas || []} />
          
          <div className="grid gap-6 border-t pt-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Evolución y Notas</h2>
              <EntradasList entradas={orden.entradas_clinicas || []} />
            </div>
            <div>
              <NuevaEntradaForm ordenId={id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seguimientos" className="mt-6">
          <SeguimientosCard
            mascotaId={orden.mascota_id}
            ordenId={id}
            seguimientos={seguimientos || []}
            featureUnavailable={seguimientoFeatureUnavailable}
            featureUnavailableReason={seguimientoFeatureReason ?? undefined}
          />
        </TabsContent>
        
        <TabsContent value="adjuntos" className="mt-6">
          <AdjuntosPanel ordenId={id} adjuntos={orden.adjuntos || []} />
        </TabsContent>
        
        <TabsContent value="venta" className="mt-6">
          <VentaPanel 
            ordenId={id} 
            clienteId={orden.cliente_id} 
            itemsCatalogo={itemsCatalogo || []} 
            initialVentas={ventas || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
