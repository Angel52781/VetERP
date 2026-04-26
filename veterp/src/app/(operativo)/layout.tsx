import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/clinica";
import { getClinicaBranding } from "./ajustes/actions";

import { OperativoNav } from "./operativo-nav";
import { AppUserMenu } from "./user-menu";

export default async function OperativoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [role, clinicaRes] = await Promise.all([
    getUserRole(),
    getClinicaBranding(),
  ]);

  const isAdminOrOwner = role === "owner" || role === "admin";
  const hideCaja = role === "veterinario" || role === "asistente";
  const clinica = clinicaRes.data;

  return (
    <div className="flex flex-1">
      <aside className="hidden w-72 border-r bg-background px-4 py-6 md:block">
        <div className="mb-8 px-1">
          <Link href="/app" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
              {clinica?.logo_url ? (
                <img src={clinica.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="font-bold text-primary">V</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                {clinica?.nombre || "VetERP"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Sede Activa
              </span>
            </div>
          </Link>
        </div>
        <div className="mb-4 px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Navegación
          </span>
        </div>
        <nav className="space-y-2">
          <OperativoNav isAdminOrOwner={isAdminOrOwner} hideCaja={hideCaja} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/app" className="font-bold tracking-tight text-sm md:hidden">
              {clinica?.nombre || "VetERP"}
            </Link>
            <span className="hidden md:inline-block text-xs text-muted-foreground font-medium">
              Panel de Gestión {clinica?.nombre ? `— ${clinica.nombre}` : ""}
            </span>
          </div>
          <AppUserMenu email={user?.email ?? ""} isAdminOrOwner={isAdminOrOwner} />
        </header>

        <nav className="border-b px-4 py-3 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <OperativoNav mobile isAdminOrOwner={isAdminOrOwner} hideCaja={hideCaja} />
          </div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
