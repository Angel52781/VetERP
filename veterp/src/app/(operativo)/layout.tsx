import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/clinica";
import { Toaster } from "@/components/ui/sonner";

import { AppUserMenu } from "./user-menu";
import { SidebarNav } from "./sidebar-nav";

export default async function OperativoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = await getUserRole();
  const isAdminOrOwner = role === "owner" || role === "admin";

  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 border-r bg-background px-4 py-6 md:block">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/inicio" className="font-semibold">
            VetERP
          </Link>
        </div>
        <SidebarNav isAdminOrOwner={isAdminOrOwner} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3">
          <Link href="/inicio" className="font-semibold md:hidden">
            VetERP
          </Link>
          <AppUserMenu email={user?.email ?? ""} isAdminOrOwner={isAdminOrOwner} />
        </header>

        <main className="flex min-w-0 flex-1 flex-col bg-slate-50 px-4 py-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
