import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogoList } from "./catalogo-client";
import { getItemsCatalogo, getProveedores } from "./actions";

export const metadata = {
  title: "Ajustes | VetERP",
  description: "Configuración y catálogos",
};

export default async function AjustesPage() {
  const [itemsRes, proveedoresRes] = await Promise.all([
    getItemsCatalogo(),
    getProveedores(),
  ]);

  const items = itemsRes.data || [];
  const proveedores = proveedoresRes.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>

      <Tabs defaultValue="catalogo" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
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
            <CardHeader>
              <CardTitle>Proveedores</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Gestión de proveedores (próximamente).
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
