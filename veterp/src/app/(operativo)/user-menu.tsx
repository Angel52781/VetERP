"use client";

import { LogOut, Settings2, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { clinicaCookieName } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export function AppUserMenu({ email, isAdminOrOwner }: { email: string; isAdminOrOwner: boolean }) {
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await createClient().auth.signOut();
      document.cookie = `${clinicaCookieName}=; Path=/; Max-Age=0`;
      window.location.href = "/login";
    });
  }

  function changeClinic() {
    document.cookie = `${clinicaCookieName}=; Path=/; Max-Age=0`;
    window.location.href = "/select-clinica";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "outline" })} disabled={pending}>
        {email || "Cuenta"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1 text-xs text-muted-foreground">Cuenta</div>
        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings2 />
          {isAdminOrOwner ? "Settings" : "Settings (solo admin)"}
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={changeClinic}>
          <Stethoscope />
          Cambiar clinica
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut />
          Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
