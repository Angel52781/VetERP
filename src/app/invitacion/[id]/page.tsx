import { createClient } from "@/lib/supabase/server";
import { getInvitationDetails } from "@/app/(operativo)/ajustes/staff-actions";
import { redirect } from "next/navigation";
import { InvitacionClient } from "./client";

export default async function InvitacionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const invitationId = params.id;
  
  if (!invitationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground">Enlace de invitación inválido.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: invitation, error } = await getInvitationDetails(invitationId);

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invitación no encontrada</h2>
          <p className="text-muted-foreground">El enlace puede estar mal escrito o la invitación fue revocada.</p>
        </div>
      </div>
    );
  }

  // Comprobar estado y expiración
  if (invitation.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-amber-600 mb-2">Invitación procesada</h2>
          <p className="text-muted-foreground">Esta invitación ya ha sido aceptada o rechazada previamente.</p>
        </div>
      </div>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invitación expirada</h2>
          <p className="text-muted-foreground">Este enlace ya no es válido. Solicita una nueva invitación al administrador de la clínica.</p>
        </div>
      </div>
    );
  }

  const clinicaNombre = Array.isArray(invitation.clinicas) 
    ? invitation.clinicas[0]?.nombre 
    : (invitation.clinicas as any)?.nombre;

  if (!user) {
    // Si no está logueado, redirigir a login, pero podemos pasar un returnTo o similar
    // Por simplicidad, le avisamos que debe iniciar sesión.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold">¡Has sido invitado!</h2>
          <p className="text-muted-foreground">
            Has sido invitado a unirte a la clínica <strong>{clinicaNombre}</strong> como <strong>{invitation.role}</strong>.
          </p>
          <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm text-left">
            La invitación está a nombre de: <strong>{invitation.email}</strong>.<br/>
            Por favor inicia sesión o regístrate usando ese mismo correo electrónico para aceptar la invitación.
          </div>
          <div className="flex gap-4 w-full pt-4">
            <a href="/login" className="flex-1 bg-primary text-primary-foreground text-center py-2 rounded-md font-medium hover:bg-primary/90">
              Iniciar Sesión
            </a>
            <a href="/signup" className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-center py-2 rounded-md font-medium">
              Registrarse
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Verificar que el correo coincide
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold text-red-600">Correo incorrecto</h2>
          <p className="text-muted-foreground">
            Has iniciado sesión como <strong>{user.email}</strong>, pero esta invitación es para <strong>{invitation.email}</strong>.
          </p>
          <a href="/auth/logout" className="inline-block mt-4 text-sm text-primary underline">
            Cerrar sesión y usar otra cuenta
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <InvitacionClient invitation={invitation} />
    </div>
  );
}
