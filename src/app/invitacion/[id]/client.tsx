"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/app/(operativo)/ajustes/staff-actions";
import { clinicaCookieName } from "@/lib/supabase/env";

export function InvitacionClient({ invitation }: { invitation: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setIsSubmitting(true);
    const res = await acceptInvitation(invitation.id);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("¡Invitación aceptada exitosamente!");
      
      // Auto-select this clinic so the user is ready to go
      if (res.data?.clinicaId) {
        document.cookie = `${clinicaCookieName}=${res.data.clinicaId}; path=/; max-age=31536000; SameSite=Lax`;
      }
      
      router.push("/app");
      router.refresh();
    }
  };

  const clinicaNombre = Array.isArray(invitation.clinicas) 
    ? invitation.clinicas[0]?.nombre 
    : (invitation.clinicas as any)?.nombre;

  return (
    <div className="bg-white p-8 rounded-lg shadow max-w-md w-full space-y-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unirse al equipo</h1>
        <p className="text-muted-foreground mt-2">
          Has sido invitado a unirte a la clínica <strong>{clinicaNombre}</strong>.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-md text-left text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tu correo:</span>
          <span className="font-medium">{invitation.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tu nuevo rol:</span>
          <span className="font-medium capitalize">{invitation.role}</span>
        </div>
      </div>

      <Button 
        className="w-full text-lg h-12" 
        onClick={handleAccept} 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Aceptando..." : "Aceptar Invitación"}
      </Button>
    </div>
  );
}
