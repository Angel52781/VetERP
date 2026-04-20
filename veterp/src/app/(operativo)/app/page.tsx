import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const clinicaId = await getClinicaIdFromCookies();

  const { data: clinica } = clinicaId
    ? await supabase
        .from("clinicas")
        .select("id,nombre")
        .eq("id", clinicaId)
        .single()
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          {clinica ? clinica.nombre : "Clínica no seleccionada"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fase 1 lista. Continúa en Clientes para crear clientes y mascotas.
        </CardContent>
      </Card>
    </div>
  );
}
