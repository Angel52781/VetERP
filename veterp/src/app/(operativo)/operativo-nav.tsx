"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperativoNavItem = {
  href: string;
  label: string;
  matchPath: string;
  matchPrefix?: boolean;
  matchTab?: string;
  adminOnly?: boolean;
  hideForVeterinario?: boolean;
};

const navItems: OperativoNavItem[] = [
  { href: "/atenciones", label: "Atenciones", matchPath: "/atenciones" },
  { href: "/colas", label: "Colas", matchPath: "/colas" },
  {
    href: "/caja_inventario?tab=caja",
    label: "Caja",
    matchPath: "/caja_inventario",
    matchTab: "caja",
    hideForVeterinario: true,
  },
  {
    href: "/caja_inventario?tab=inventario",
    label: "Inventario",
    matchPath: "/caja_inventario",
    matchTab: "inventario",
  },
  { href: "/agenda", label: "Agenda", matchPath: "/agenda" },
  { href: "/clientes", label: "Clientes", matchPath: "/clientes", matchPrefix: true },
  { href: "/ajustes", label: "Settings", matchPath: "/ajustes", adminOnly: true },
];

type OperativoNavProps = {
  mobile?: boolean;
  isAdminOrOwner: boolean;
  isVeterinario: boolean;
};

function isActive(item: OperativoNavItem, pathname: string, tabParam: string | null) {
  const pathMatches = item.matchPrefix
    ? pathname === item.matchPath || pathname.startsWith(`${item.matchPath}/`)
    : pathname === item.matchPath;

  if (!pathMatches) {
    return false;
  }

  if (!item.matchTab) {
    return true;
  }

  return tabParam === item.matchTab;
}

export function OperativoNav({ mobile = false, isAdminOrOwner, isVeterinario }: OperativoNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  return (
    <>
      {navItems
        .filter((item) => !item.adminOnly || isAdminOrOwner)
        .filter((item) => !item.hideForVeterinario || !isVeterinario)
        .map((item) => {
          const active = isActive(item, pathname, tabParam);

          return (
            <Link
              key={`${mobile ? "mobile" : "desktop"}-${item.href}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: mobile ? "outline" : "ghost",
                  className: mobile ? "h-8 whitespace-nowrap px-3 text-xs" : "w-full justify-start",
                }),
                active && (mobile ? "border-primary text-primary" : "bg-muted text-foreground"),
              )}
            >
              {item.label}
            </Link>
          );
        })}
    </>
  );
}
