import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserRole } from "@/lib/clinica";

export default async function SettingsPage() {
  const role = await getUserRole();

  if (role === "owner" || role === "admin") {
    redirect("/ajustes");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Esta seccion solo esta disponible para owner/admin de la clinica activa.</p>
          <Link href="/app" className={buttonVariants({ variant: "outline" })}>
            Volver al panel
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
