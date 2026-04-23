"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Package, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  isAdminOrOwner: boolean;
}

export function SidebarNav({ isAdminOrOwner }: SidebarNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      href: "/inicio",
      label: "Inicio",
      icon: Home,
      active: pathname === "/inicio",
    },
    {
      href: "/clientes",
      label: "Clientes",
      icon: Users,
      active: pathname === "/clientes" || pathname.startsWith("/clientes/"),
    },
    {
      href: "/caja_inventario",
      label: "Caja e Inventario",
      icon: Package,
      active: pathname === "/caja_inventario" || pathname.startsWith("/caja_inventario/"),
    },
  ];

  if (isAdminOrOwner) {
    routes.push({
      href: "/ajustes",
      label: "Ajustes",
      icon: Settings,
      active: pathname === "/ajustes" || pathname.startsWith("/ajustes/"),
    });
  }

  return (
    <nav className="space-y-2">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            buttonVariants({
              variant: route.active ? "secondary" : "ghost",
              className: "w-full justify-start",
            })
          )}
        >
          <route.icon className="mr-2 h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
