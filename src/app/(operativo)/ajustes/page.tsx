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
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? "Usuario";

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

      <Tabs defaultValue="cuenta" className="w-full">
        <TabsList className="flex w-full min-w-0 overflow-x-auto sm:flex-wrap sm:justify-start">
          <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
          {isAdminOrOwner ? (
            <TabsTrigger value="general">General</TabsTrigger>
          ) : null}
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          {isAdminOrOwner ? (
            <>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
              <TabsTrigger value="categorias">Categorías</TabsTrigger>
              <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
              <TabsTrigger value="almacenes">Almacenes</TabsTrigger>
            </>
          ) : null}
        </TabsList>

        <TabsContent value="cuenta" className="mt-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Mi Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Correo electrónico</h3>
                <p className="text-base font-medium">{email}</p>
              </div>
              <div className="pt-4 border-t space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="/auth/clear-clinica" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Cambiar clínica
                  </a>
                  <a href="/auth/logout" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-200 text-red-700 hover:bg-red-50 h-10 px-4 py-2">
                    Cerrar sesión
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
