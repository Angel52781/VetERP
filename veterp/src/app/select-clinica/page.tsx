import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { bootstrapDemoAccess, selectClinica, signOutFromSelectClinica } from "./actions";

type SelectClinicaPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function getErrorMessage(errorCode?: string) {
  if (!errorCode) {
    return null;
  }

  if (errorCode === "no_access") {
    return "No tienes acceso a la clinica seleccionada.";
  }

  if (errorCode === "invalid_clinic") {
    return "Debes seleccionar una clinica valida.";
  }

  return "No se pudo continuar con la clinica seleccionada.";
}

export default async function SelectClinicaPage({ searchParams }: SelectClinicaPageProps) {
  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("user_clinicas")
    .select("clinica_id, role")
    .eq("user_id", user.id);

  const clinicaIds = (memberships ?? []).map((m) => m.clinica_id);
  const { data: clinicas } =
    clinicaIds.length > 0
      ? await supabase.from("clinicas").select("id,nombre").in("id", clinicaIds).order("nombre")
      : { data: [] };

  if (!clinicas?.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Acceso pendiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Tu cuenta no tiene clinicas asignadas. Solicita acceso al administrador de tu organizacion.</p>
            <form action={bootstrapDemoAccess}>
              <Button type="submit" className="w-full">
                Crear entorno demo y entrar
              </Button>
            </form>
            <form action={signOutFromSelectClinica}>
              <Button type="submit" variant="outline" className="w-full">
                Cerrar sesion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleByClinica = new Map((memberships ?? []).map((m) => [m.clinica_id, m.role]));

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10 max-w-4xl w-full mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Seleccionar clinica</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {clinicas.map((clinica) => (
          <Card key={clinica.id}>
            <CardHeader>
              <CardTitle className="text-base">{clinica.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Rol: {roleByClinica.get(clinica.id) ?? "miembro"}
              </p>
              <form action={selectClinica}>
                <input type="hidden" name="clinicaId" value={String(clinica.id)} />
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <form action={signOutFromSelectClinica} className="max-w-xs">
        <Button type="submit" variant="ghost" className="w-full">
          Cambiar de cuenta
        </Button>
      </form>
    </div>
  );
}
