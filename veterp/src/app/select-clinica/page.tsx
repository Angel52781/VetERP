import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Building2, ArrowRight } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido a VetERP
          </h1>
          <p className="text-muted-foreground">
            Sesión iniciada como <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(clinicas ?? []).map((c) => (
            <Card key={c.id} className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50 flex flex-col">
              <CardHeader className="pb-4 flex-1">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">{c.nombre}</CardTitle>
                <CardDescription>Área de trabajo</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <form action={selectClinica}>
                  <input type="hidden" name="clinicaId" value={c.id} />
                  <Button type="submit" variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Ingresar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}

          <CreateClinicaForm />
        </div>
      </div>
    </div>
  );
}
