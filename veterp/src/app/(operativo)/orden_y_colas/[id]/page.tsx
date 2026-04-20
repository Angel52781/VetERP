import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getOrdenCompleta } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntradasList } from "./entradas-list";
import { NuevaEntradaForm } from "./nueva-entrada-form";
import { AdjuntosPanel } from "./adjuntos-panel";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrdenDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const { data: orden, error } = await getOrdenCompleta(id);

  if (error || !orden) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orden de Servicio</h1>
          <p className="text-muted-foreground mt-1">ID: {orden.id}</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-medium text-sm">
          Estado: {orden.estado || "Abierta"}
        </div>
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="notas">Notas Clínicas</TabsTrigger>
          <TabsTrigger value="adjuntos">Adjuntos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resumen" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-1 text-sm">
                  <span className="font-medium text-muted-foreground">Nombre:</span>
                  <span className="col-span-2 font-medium">{orden.clientes?.nombre}</span>
                  
                  <span className="font-medium text-muted-foreground">Teléfono:</span>
                  <span className="col-span-2">{orden.clientes?.telefono || "N/A"}</span>
                  
                  <span className="font-medium text-muted-foreground">Email:</span>
                  <span className="col-span-2">{orden.clientes?.email || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mascota</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-1 text-sm">
                  <span className="font-medium text-muted-foreground">Nombre:</span>
                  <span className="col-span-2 font-medium">{orden.mascotas?.nombre}</span>
                  
                  <span className="font-medium text-muted-foreground">Especie:</span>
                  <span className="col-span-2">{orden.mascotas?.especie || "N/A"}</span>
                  
                  <span className="font-medium text-muted-foreground">Raza:</span>
                  <span className="col-span-2">{orden.mascotas?.raza || "N/A"}</span>

                  <span className="font-medium text-muted-foreground">Edad:</span>
                  <span className="col-span-2">
                    {orden.mascotas?.nacimiento
                      ? `${Math.floor(
                          (new Date().getTime() - new Date(orden.mascotas.nacimiento).getTime()) /
                            (1000 * 60 * 60 * 24 * 365.25)
                        )} años`
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Orden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Fecha de Creación</p>
                  <p>{format(new Date(orden.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                </div>
                {/* Agrega más campos relevantes si están disponibles en la tabla ordenes_servicio */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notas" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Historial de Notas</h2>
              <EntradasList entradas={orden.entradas_clinicas || []} />
            </div>
            <div>
              <NuevaEntradaForm ordenId={id} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="adjuntos" className="mt-6">
          <AdjuntosPanel ordenId={id} adjuntos={orden.adjuntos || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
