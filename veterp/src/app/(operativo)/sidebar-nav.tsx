"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Home, 
  Users, 
  Package, 
  Settings, 
  Wallet, 
  Calendar,
  ListTodo,
  Activity
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

interface SidebarNavProps {
  isAdminOrOwner: boolean;
}

function SidebarNavContent({ isAdminOrOwner }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const routes = [
    {
      href: "/inicio",
      label: "Atenciones",
      icon: Activity,
      active: pathname === "/inicio",
    },
    {
      href: "/index",
      label: "Colas",
      icon: ListTodo,
      active: pathname === "/index",
    },
    {
      href: "/caja_inventario",
      label: "Caja",
      icon: Wallet,
      active: pathname === "/caja_inventario" && tab !== "inventario",
    },
    {
      href: "/caja_inventario?tab=inventario",
      label: "Inventario",
      icon: Package,
      active: pathname === "/caja_inventario" && tab === "inventario",
    },
    {
      href: "/agenda",
      label: "Agenda",
      icon: Calendar,
      active: pathname === "/agenda" || pathname.startsWith("/agenda/"),
    },
    {
      href: "/clientes",
      label: "Clientes",
      icon: Users,
      active: pathname === "/clientes" || pathname.startsWith("/clientes/"),
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

export function SidebarNav({ isAdminOrOwner }: SidebarNavProps) {
  return (
    <Suspense fallback={<nav className="space-y-2" />}>
      <SidebarNavContent isAdminOrOwner={isAdminOrOwner} />
    </Suspense>
  );
}
