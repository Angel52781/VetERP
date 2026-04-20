import { cookies } from "next/headers";

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
