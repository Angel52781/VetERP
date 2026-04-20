import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { AppUserMenu } from "./user-menu";

export default async function OperativoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1">
      <aside className="hidden w-64 border-r bg-background px-4 py-6 md:block">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/app" className="font-semibold">
            VetERP
          </Link>
        </div>
        <nav className="space-y-2">
          <Link
            href="/app"
            className={buttonVariants({
              variant: "ghost",
              className: "w-full justify-start",
            })}
          >
            Inicio
          </Link>
          <Link
            href="/clientes"
            className={buttonVariants({
              variant: "ghost",
              className: "w-full justify-start",
            })}
          >
            Clientes
          </Link>
          <Link
            href="/ajustes"
            className={buttonVariants({
              variant: "ghost",
              className: "w-full justify-start",
            })}
          >
            Ajustes
          </Link>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <Link href="/app" className="font-semibold md:hidden">
            VetERP
          </Link>
          <AppUserMenu email={user?.email ?? ""} />
        </header>

        <main className="flex min-w-0 flex-1 flex-col px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
