"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const resetPasswordSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

export type ResetPasswordState = { 
  error: string | null;
  success: string | null;
};

export async function resetPassword(_: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: null };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: "No se pudo enviar el correo de recuperación. Intenta nuevamente.", success: null };
  }

  return { error: null, success: "Revisa tu correo electrónico para el enlace de recuperación." };
}
