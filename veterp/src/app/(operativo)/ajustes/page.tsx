import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogoList } from "./catalogo-client";
import { ProveedoresList } from "./proveedores-client";
import { AlmacenesList } from "./almacenes-client";
import { CategoriasList } from "./categorias-client";
import { ClinicaGeneralForm } from "./clinica-form-client";
import { getItemsCatalogo, getProveedores, getAlmacenes, getClinicaBranding, getCategorias } from "./actions";
import { getStaff, getInvitations } from "./staff-actions";
import { StaffClient } from "./staff-client";
import { SeedDemoButton } from "./seed-demo-button";
import { getUserRole, getActiveClinicaContext } from "@/lib/clinica";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Ajustes | VetERP",
  description: "Configuración y catálogos",
};

export default async function AjustesPage() {
  const enableDemoSeed = process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true";

  // Fetch context and guard FIRST before any admin-only actions
  const [context, itemsRes, proveedoresRes, almacenesRes, clinicaRes, categoriasRes] = await Promise.all([
    getActiveClinicaContext(),
    getItemsCatalogo(),
    getProveedores(),
    getAlmacenes(),
    getClinicaBranding(),
    getCategorias(),
  ]);

  const role = context?.role ?? "";

  if (role !== "owner" && role !== "admin") {
    redirect("/settings");
  }

  // Only fetch admin-only data after confirming role
  const [staffRes, invRes] = await Promise.all([
    getStaff(),
    getInvitations(),
  ]);

  const items = itemsRes.data || [];
  const proveedores = proveedoresRes.data || [];
  const almacenes = almacenesRes.data || [];
  const clinica = clinicaRes.data;
  const categorias = categoriasRes.data || [];
  const staff = staffRes.data || [];
  const invitations = invRes.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>

      <Tabs defaultValue="catalogo" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="almacenes">Almacenes</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          {clinica && <ClinicaGeneralForm clinica={clinica} />}
          
          {enableDemoSeed && (
            <div className="mt-8 pt-8 border-t">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Herramientas de Desarrollador</CardTitle>
                </CardHeader>
                <CardContent>
                  <SeedDemoButton />
                  <p className="text-[10px] text-muted-foreground mt-2">
                    CUIDADO: Esto borrará tus datos actuales de esta clínica y los reemplazará por el set demo.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <StaffClient 
                staff={staff} 
                invitations={invitations} 
                currentUserRole={role} 
                currentUserId={context?.userId || ""} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="catalogo" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <CatalogoList items={items} proveedores={proveedores} categorias={categorias} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categorias" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <CategoriasList categorias={categorias} />
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
