import type { CSSProperties } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/clinica";
import { buildClinicThemeStyle } from "@/lib/appearance";
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
  const clinicThemeStyle = buildClinicThemeStyle({
    theme_preset_text: clinica?.theme_preset_text,
    brand_color_text: clinica?.brand_color_text,
  }) as CSSProperties;

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row" style={{ ...clinicThemeStyle, backgroundColor: "var(--brand-surface)" }}>
      <aside className="hidden w-72 shrink-0 border-r px-4 py-6 md:block" style={{ backgroundColor: "var(--brand-sidebar-surface)" }}>
        <div className="mb-8 px-1">
          <Link href="/app" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
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
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-3 py-3 sm:px-4 shadow-[inset_0_-2px_0_var(--brand-border)]">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/app" className="font-bold tracking-tight text-sm md:hidden">
              {clinica?.nombre || "VetERP"}
            </Link>
            <span className="hidden truncate text-xs font-medium text-muted-foreground md:inline-block">
              Panel de Gestión {clinica?.nombre ? `— ${clinica.nombre}` : ""}
            </span>
          </div>
          <AppUserMenu email={user?.email ?? ""} isAdminOrOwner={isAdminOrOwner} />
        </header>

        <nav className="border-b px-3 py-3 sm:px-4 md:hidden">
          <div className="-mb-1 flex gap-2 overflow-x-auto pb-1">
            <OperativoNav mobile isAdminOrOwner={isAdminOrOwner} hideCaja={hideCaja} />
          </div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
