"use server";

import { cookies } from "next/headers";

import { clinicaCookieName } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function signOutAndClearSession() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.error("Supabase signout error:", e);
  }

  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);
}

export async function clearActiveClinica() {
  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);
}
