"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";

import { clinicaCookieName } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const createClinicaSchema = z.object({
  nombre: z.string().min(2),
});

const selectClinicaSchema = z.object({
  clinicaId: z.string().uuid(),
});

export type CreateClinicaState = { error: string | null };

export async function createClinica(
  _: CreateClinicaState,
  formData: FormData,
): Promise<CreateClinicaState> {
  const parsed = createClinicaSchema.safeParse({
    nombre: formData.get("nombre"),
  });

  if (!parsed.success) {
    return { error: "Nombre inválido." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_clinica", {
    p_nombre: parsed.data.nombre,
  });

  if (error || !data) {
    return { error: "No se pudo crear la clínica." };
  }

  const cookieStore = await cookies();
  cookieStore.set(clinicaCookieName, data, { path: "/", sameSite: "lax" });
  redirect("/app");
}

export async function selectClinica(formData: FormData) {
  const parsed = selectClinicaSchema.safeParse({
    clinicaId: formData.get("clinicaId"),
  });

  if (!parsed.success) {
    redirect("/select-clinica");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_clinicas")
    .select("clinica_id")
    .eq("clinica_id", parsed.data.clinicaId)
    .maybeSingle();

  if (error || !data) {
    redirect("/select-clinica");
  }

  const cookieStore = await cookies();
  cookieStore.set(clinicaCookieName, parsed.data.clinicaId, {
    path: "/",
    sameSite: "lax",
  });

  redirect("/app");
}

export async function clearClinica() {
  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);
  redirect("/select-clinica");
}
