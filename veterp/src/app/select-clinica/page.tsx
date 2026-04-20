import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { selectClinica } from "./actions";
import CreateClinicaForm from "./create-clinica-form";

export default async function SelectClinicaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: clinicas } = await supabase
    .from("clinicas")
    .select("id,nombre")
    .order("nombre");

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10 max-w-3xl w-full mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Seleccionar clínica
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(clinicas ?? []).map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">{c.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={selectClinica}>
                <input type="hidden" name="clinicaId" value={c.id} />
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}

        <CreateClinicaForm />
      </div>
    </div>
  );
}
