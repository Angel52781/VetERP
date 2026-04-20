"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type SignupState = { error: string | null };

export async function signup(_: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Datos inválidos. La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    return { error: "No se pudo registrar la cuenta. " + error.message };
  }

  redirect("/select-clinica");
}
