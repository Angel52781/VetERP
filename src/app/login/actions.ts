"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginState = { error: string | null };

function mapLoginError(message?: string): string {
  const normalized = (message ?? "").toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Credenciales invalidas. Verifica email y contrasena.";
  }

  if (normalized.includes("email not confirmed")) {
    return "La cuenta existe pero el email no esta confirmado.";
  }

  return "No se pudo iniciar sesion.";
}

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Credenciales invalidas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: mapLoginError(error.message) };
  }

  redirect("/select-clinica");
}
