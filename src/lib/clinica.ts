import { cookies } from "next/headers";

import { clinicaCookieName } from "./supabase/env";
import { createClient } from "./supabase/server";

export type ActiveClinicaContext = {
  clinicaId: string;
  role: string;
  userId: string;
};

export async function getClinicaIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(clinicaCookieName)?.value ?? null;
}

export async function getActiveClinicaContext(): Promise<ActiveClinicaContext | null> {
  const cookieStore = await cookies();
  const clinicaId = cookieStore.get(clinicaCookieName)?.value;
  if (!clinicaId) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from("user_clinicas")
    .select("role")
    .eq("user_id", user.id)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  if (!membership) {
    cookieStore.delete(clinicaCookieName);
    return null;
  }

  return {
    clinicaId,
    role: membership.role,
    userId: user.id,
  };
}

export async function requireClinicaIdFromCookies(): Promise<string> {
  const context = await getActiveClinicaContext();
  if (!context) {
    throw new Error("No hay una clinica activa valida para esta cuenta.");
  }
  return context.clinicaId;
}

export async function requireUserRole(allowedRoles: string[]): Promise<{ clinicaId: string; role: string }> {
  const context = await getActiveClinicaContext();
  if (!context) {
    throw new Error("No hay contexto de clinica valido.");
  }

  if (!allowedRoles.includes(context.role)) {
    throw new Error(
      `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`,
    );
  }

  return { clinicaId: context.clinicaId, role: context.role };
}

export async function getUserRole(): Promise<string | null> {
  const context = await getActiveClinicaContext();
  return context?.role ?? null;
}
