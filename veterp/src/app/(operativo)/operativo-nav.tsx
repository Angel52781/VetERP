"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperativoNavItem = {
  href: string;
  label: string;
  matchPath: string;
  matchPrefix?: boolean;
  matchTab?: string;
  adminOnly?: boolean;
  hideForCaja?: boolean;
};

const navItems: OperativoNavItem[] = [
  { href: "/app", label: "Inicio", matchPath: "/app" },
  { href: "/atenciones", label: "Atenciones", matchPath: "/atenciones" },
  { href: "/colas", label: "Colas", matchPath: "/colas" },
  {
    href: "/caja",
    label: "Caja",
    matchPath: "/caja",
    hideForCaja: true,
  },
  {
    href: "/inventario",
    label: "Inventario",
    matchPath: "/inventario",
  },
  { href: "/agenda", label: "Agenda", matchPath: "/agenda" },
  { href: "/clientes", label: "Clientes", matchPath: "/clientes", matchPrefix: true },
  { href: "/pacientes", label: "Pacientes", matchPath: "/pacientes", matchPrefix: true },
  { href: "/ajustes", label: "Ajustes", matchPath: "/ajustes", adminOnly: true },
];

type OperativoNavProps = {
  mobile?: boolean;
  isAdminOrOwner: boolean;
  hideCaja: boolean;
};

function isActive(item: OperativoNavItem, pathname: string) {
  return item.matchPrefix
    ? pathname === item.matchPath || pathname.startsWith(`${item.matchPath}/`)
    : pathname === item.matchPath;
}

export function OperativoNav({ mobile = false, isAdminOrOwner, hideCaja }: OperativoNavProps) {
  const pathname = usePathname();

  return (
    <>
      {navItems
        .filter((item) => !item.adminOnly || isAdminOrOwner)
        .filter((item) => !item.hideForCaja || !hideCaja)
        .map((item) => {
          const active = isActive(item, pathname);

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
