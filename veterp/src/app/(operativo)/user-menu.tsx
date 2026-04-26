"use client";

import { LogOut, Settings2, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AppUserMenu({ email, isAdminOrOwner }: { email: string; isAdminOrOwner: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "outline" })}>
        {email || "Cuenta"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1 text-xs text-muted-foreground">Cuenta</div>
        <DropdownMenuSeparator />

        {isAdminOrOwner ? (
          <DropdownMenuItem render={<Link href="/ajustes" />}>
            <Settings2 />
            Settings
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem render={<a href="/auth/clear-clinica" />}>
          <Stethoscope />
          Cambiar clinica
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<a href="/auth/logout" />}>
          <LogOut />
          Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
