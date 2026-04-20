import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

import { clinicaCookieName } from "./supabase/env";

export async function getClinicaIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(clinicaCookieName)?.value ?? null;
}

export async function requireClinicaIdFromCookies(): Promise<string> {
  const clinicaId = await getClinicaIdFromCookies();
  if (!clinicaId) {
    throw new Error("No hay clínica seleccionada.");
  }
  return clinicaId;
}

export async function requireUserRole(allowedRoles: string[]): Promise<{ clinicaId: string, role: string }> {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado.");
  }

  const { data: membership, error } = await supabase
    .from("user_clinicas")
    .select("role")
    .eq("user_id", user.id)
    .eq("clinica_id", clinicaId)
    .single();

  if (error || !membership) {
    throw new Error("No se encontró el rol del usuario en la clínica.");
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new Error(`Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`);
  }

  return { clinicaId, role: membership.role };
}

export async function getUserRole(): Promise<string | null> {
  try {
    const clinicaId = await getClinicaIdFromCookies();
    if (!clinicaId) return null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from("user_clinicas")
      .select("role")
      .eq("user_id", user.id)
      .eq("clinica_id", clinicaId)
      .single();

    return membership?.role ?? null;
  } catch {
    return null;
  }
}
