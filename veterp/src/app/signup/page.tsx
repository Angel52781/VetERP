import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso administrado</CardTitle>
          <CardDescription>
            El registro publico esta deshabilitado para VetERP. El acceso se habilita por invitacion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Si ya tienes una cuenta, inicia sesion. Si aun no tienes acceso, solicita alta al administrador de tu
            clinica.
          </p>
          <Link href="/login" className={buttonVariants({ className: "w-full" })}>
            Ir a iniciar sesion
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
