import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/clinica";

import { AppUserMenu } from "./user-menu";

const navItems = [
  { href: "/atenciones", label: "Atenciones" },
  { href: "/colas", label: "Colas" },
  { href: "/caja", label: "Caja" },
  { href: "/inventario", label: "Inventario" },
  { href: "/agenda", label: "Agenda" },
  { href: "/clientes", label: "Clientes" },
  { href: "/settings", label: "Settings" },
];

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
      <aside className="hidden w-72 border-r bg-background px-4 py-6 md:block">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/app" className="font-semibold">
            VetERP
          </Link>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={buttonVariants({
                  variant: "ghost",
                  className: "w-full justify-start",
                })}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <Link href="/app" className="font-semibold">
            VetERP
          </Link>
          <AppUserMenu email={user?.email ?? ""} isAdminOrOwner={isAdminOrOwner} />
        </header>

        <nav className="border-b px-4 py-3 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className={buttonVariants({
                    variant: "outline",
                    className: "h-8 whitespace-nowrap px-3 text-xs",
                  })}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
