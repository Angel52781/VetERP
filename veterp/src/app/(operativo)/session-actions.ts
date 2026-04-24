"use server";

import { cookies } from "next/headers";

import { clinicaCookieName } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function signOutAndClearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);
}

export async function clearActiveClinica() {
  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);
}
