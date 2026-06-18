"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
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
  { href: "/recepcion", label: "Recepción", matchPath: "/recepcion" },
  { href: "/agenda", label: "Agenda", matchPath: "/agenda" },
  { href: "/grooming", label: "Grooming", matchPath: "/grooming" },
  { href: "/hospitalizaciones", label: "Hospitalizaciones", matchPath: "/hospitalizaciones" },
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

function buildVisibleItems(isAdminOrOwner: boolean, hideCaja: boolean) {
  return navItems
    .filter((item) => !item.adminOnly || isAdminOrOwner)
    .filter((item) => !item.hideForCaja || !hideCaja);
}

export function OperativoNav({ mobile = false, isAdminOrOwner, hideCaja }: OperativoNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visibleItems = useMemo(
    () => buildVisibleItems(isAdminOrOwner, hideCaja),
    [isAdminOrOwner, hideCaja],
  );

  useEffect(() => {
    if (mobile) {
      setOpen(false);
    }
  }, [mobile, pathname]);

  if (mobile) {
    return (
      <div className="relative md:hidden">
        <button
          type="button"
          aria-controls="operativo-mobile-nav"
          aria-expanded={open}
          aria-label={open ? "Cerrar menu de navegacion" : "Abrir menu de navegacion"}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 rounded-full px-3 shadow-sm",
          )}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          {open ? "Cerrar" : "Menu"}
        </button>

        {open ? (
          <div
            id="operativo-mobile-nav"
            className="absolute left-0 top-[calc(100%+0.75rem)] z-40 flex w-[min(18rem,calc(100vw-1.5rem))] flex-col gap-2 rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur"
          >
            {visibleItems.map((item) => {
              const active = isActive(item, pathname);

              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      className: "h-10 w-full justify-start rounded-xl px-4 text-sm",
                    }),
                    active
                      ? "border border-[var(--brand-border)] bg-[var(--brand-soft)] text-primary shadow-sm"
                      : "text-foreground/85",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {visibleItems.map((item) => {
          const active = isActive(item, pathname);

          return (
            <Link
              key={`desktop-${item.href}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: "w-full justify-start",
                }),
                active &&
                  "border border-[var(--brand-border)] bg-[var(--brand-sidebar-active)] text-primary shadow-sm",
              )}
            >
              {item.label}
            </Link>
          );
        })}
    </>
  );
}
