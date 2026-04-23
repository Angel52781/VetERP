import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogoList } from "./catalogo-client";
import { ProveedoresList } from "./proveedores-client";
import { AlmacenesList } from "./almacenes-client";
import { getItemsCatalogo, getProveedores, getAlmacenes } from "./actions";
import { getUserRole } from "@/lib/clinica";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Ajustes | VetERP",
  description: "Configuración y catálogos",
};

export default async function AjustesPage() {
  const [role, itemsRes, proveedoresRes, almacenesRes] = await Promise.all([
    getUserRole(),
    getItemsCatalogo(),
    getProveedores(),
    getAlmacenes(),
  ]);

  if (role !== "owner" && role !== "admin") {
    redirect("/settings");
  }

  const items = itemsRes.data || [];
  const proveedores = proveedoresRes.data || [];
  const almacenes = almacenesRes.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>

      <Tabs defaultValue="catalogo" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="almacenes">Almacenes</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ajustes Generales</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Configuración general de la clínica.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="catalogo" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <CatalogoList items={items} proveedores={proveedores} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="proveedores" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ProveedoresList proveedores={proveedores} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="almacenes" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <AlmacenesList almacenes={almacenes} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
