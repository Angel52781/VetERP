import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveClinicaContext } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const context = await getActiveClinicaContext();
  if (!context) {
    redirect("/select-clinica");
  }

  const supabase = await createClient();
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(now.getDate() + 7);

  const [clinicaRes, clientesRes, mascotasRes, ordenesRes, citasRes] = await Promise.all([
    supabase.from("clinicas").select("nombre").eq("id", context.clinicaId).maybeSingle(),
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", context.clinicaId),
    supabase
      .from("mascotas")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", context.clinicaId),
    supabase
      .from("ordenes_servicio")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", context.clinicaId)
      .in("estado_text", ["open", "in_progress"]),
    supabase
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", context.clinicaId)
      .gte("start_date", now.toISOString())
      .lte("start_date", inSevenDays.toISOString()),
  ]);

  const clinicaNombre = clinicaRes.data?.nombre ?? "Clinica activa";
  const clientesCount = clientesRes.count ?? 0;
  const mascotasCount = mascotasRes.count ?? 0;
  const ordenesActivasCount = ordenesRes.count ?? 0;
  const citasProximasCount = citasRes.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Panel operativo</h1>
        <p className="text-sm text-muted-foreground">{clinicaNombre}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atenciones activas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{ordenesActivasCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Citas proximas (7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{citasProximasCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{clientesCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mascotas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{mascotasCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones rapidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/atenciones" className={buttonVariants({})}>
            Ir a atenciones
          </Link>
          <Link href="/agenda" className={buttonVariants({ variant: "outline" })}>
            Ver agenda
          </Link>
          <Link href="/clientes/nuevo" className={buttonVariants({ variant: "outline" })}>
            Crear cliente
          </Link>
          <Link href="/caja" className={buttonVariants({ variant: "outline" })}>
            Revisar caja
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
