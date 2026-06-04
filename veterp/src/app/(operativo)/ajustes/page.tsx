import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActiveClinicaContext } from "@/lib/clinica";

import { AlmacenesList } from "./almacenes-client";
import { AparienciaClient } from "./apariencia-client";
import { CatalogoList } from "./catalogo-client";
import { CategoriasList } from "./categorias-client";
import { ClinicaGeneralForm } from "./clinica-form-client";
import {
  getAlmacenes,
  getCategorias,
  getClinicaApariencia,
  getClinicaBranding,
  getItemsCatalogo,
  listClinicaTemasGuardados,
  getProveedores,
} from "./actions";
import { ProveedoresList } from "./proveedores-client";
import { SeedDemoButton } from "./seed-demo-button";
import { getInvitations, getStaff } from "./staff-actions";
import { StaffClient } from "./staff-client";

export const metadata = {
  title: "Ajustes | VetERP",
  description: "Configuracion y catalogos",
};

export default async function AjustesPage() {
  const enableDemoSeed = process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true";
  const context = await getActiveClinicaContext();

  if (!context) {
    redirect("/select-clinica");
  }

  const role = context.role ?? "";
  const isAdminOrOwner = role === "owner" || role === "admin";
  const tabTriggerClassName = "h-10 flex-1 basis-[140px] px-4 text-sm";

  const [clinicaRes, aparienciaRes, temasGuardadosRes] = await Promise.all([
    getClinicaBranding(),
    getClinicaApariencia(),
    listClinicaTemasGuardados(),
  ]);

  const [itemsRes, proveedoresRes, almacenesRes, categoriasRes, staffRes, invRes] =
    isAdminOrOwner
      ? await Promise.all([
          getItemsCatalogo(),
          getProveedores(),
          getAlmacenes(),
          getCategorias(),
          getStaff(),
          getInvitations(),
        ])
      : [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
        ];

  const items = itemsRes.data || [];
  const proveedores = proveedoresRes.data || [];
  const almacenes = almacenesRes.data || [];
  const clinica = clinicaRes.data;
  const apariencia = aparienciaRes.data;
  const temasGuardados = temasGuardadosRes.data || [];
  const categorias = categoriasRes.data || [];
  const staff = staffRes.data || [];
  const invitations = invRes.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>

      <Tabs defaultValue={isAdminOrOwner ? "catalogo" : "apariencia"} className="w-full">
        <TabsList className="group-data-horizontal/tabs:h-auto grid h-auto w-full grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 overflow-x-auto rounded-2xl border bg-muted/40 p-2 sm:overflow-visible">
          {isAdminOrOwner ? (
            <TabsTrigger value="general" className={tabTriggerClassName}>
              General
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="apariencia" className={tabTriggerClassName}>
            Apariencia
          </TabsTrigger>
          {isAdminOrOwner ? (
            <>
              <TabsTrigger value="staff" className={tabTriggerClassName}>
                Staff
              </TabsTrigger>
              <TabsTrigger value="catalogo" className={tabTriggerClassName}>
                Catalogo
              </TabsTrigger>
              <TabsTrigger value="categorias" className={tabTriggerClassName}>
                Categorias
              </TabsTrigger>
              <TabsTrigger value="proveedores" className={tabTriggerClassName}>
                Proveedores
              </TabsTrigger>
              <TabsTrigger value="almacenes" className={tabTriggerClassName}>
                Almacenes
              </TabsTrigger>
            </>
          ) : null}
        </TabsList>

        {isAdminOrOwner ? (
          <TabsContent value="general" className="mt-6">
            {clinica && <ClinicaGeneralForm clinica={clinica} />}

            {enableDemoSeed && (
              <div className="mt-8 border-t pt-8">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Herramientas de Desarrollador</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SeedDemoButton />
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      CUIDADO: Esto borrara tus datos actuales de esta clinica y los reemplazara por el set demo.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ) : null}

        <TabsContent value="apariencia" className="mt-6">
          <AparienciaClient
            apariencia={apariencia}
            temasGuardados={temasGuardados}
            canEdit={isAdminOrOwner}
            loadError={aparienciaRes.error || temasGuardadosRes.error}
          />
        </TabsContent>

        {isAdminOrOwner ? (
          <>
            <TabsContent value="staff" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <StaffClient
                    staff={staff}
                    invitations={invitations}
                    currentUserRole={role}
                    currentUserId={context.userId}
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
          </>
        ) : null}
      </Tabs>
    </div>
  );
}
