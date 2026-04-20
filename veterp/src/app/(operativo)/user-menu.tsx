"use client";

import { LogOut, Settings2, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clinicaCookieName } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

import { clearClinica } from "../select-clinica/actions";

export function AppUserMenu({ email, isAdminOrOwner }: { email: string, isAdminOrOwner: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await createClient().auth.signOut();
      document.cookie = `${clinicaCookieName}=; Path=/; Max-Age=0`;
      window.location.href = "/login";
    });
  }

  function changeClinic() {
    startTransition(async () => {
      await clearClinica();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "outline" })}
        disabled={pending}
      >
        {email ? email : "Cuenta"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdminOrOwner && (
          <DropdownMenuItem onSelect={() => router.push("/ajustes")}>
            <Settings2 />
            Ajustes
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={changeClinic}>
          <Stethoscope />
          Cambiar clínica
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut />
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
