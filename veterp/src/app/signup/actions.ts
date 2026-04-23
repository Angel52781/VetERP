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

  const { data: authData, error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    return { error: "No se pudo registrar la cuenta. " + error.message };
  }

  const user = authData.user;
  if (user) {
    // Si tenemos SUPABASE_SERVICE_ROLE_KEY, lo usamos para asegurar que pasamos RLS
    // en caso de que authData.session sea null (e.g. si hay confirmación de email).
    let adminClient = supabase;
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasServiceRole) {
      const { createServerClient } = await import("@supabase/ssr");
      adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );
    }

    let clinicaId: string | null = null;

    if (hasServiceRole) {
      // 1. Inserción directa saltando RLS
      const { data: clinica, error: clinicaError } = await adminClient
        .from("clinicas")
        .insert({ nombre: `Clínica de ${parsed.data.email}`, created_by: user.id })
        .select("id")
        .single();

      if (!clinicaError && clinica) {
        clinicaId = clinica.id;
        await adminClient
          .from("user_clinicas")
          .insert({ user_id: user.id, clinica_id: clinicaId, role: "owner" });
      } else {
        console.error("Error creating clinica (admin):", clinicaError);
      }
    } else {
      // 1. Usar el RPC con la sesión actual
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_clinica", {
        p_nombre: `Clínica de ${parsed.data.email}`,
      });
      if (!rpcError && rpcData) {
        clinicaId = rpcData;
      } else {
        console.error("Error creating clinica (rpc):", rpcError);
      }
    }

    if (clinicaId) {
      // 2. Set the clinica cookie
      const { cookies } = await import("next/headers");
      const { clinicaCookieName } = await import("@/lib/supabase/env");
      const cookieStore = await cookies();
      cookieStore.set(clinicaCookieName, clinicaId, { path: "/", sameSite: "lax" });

      // 3. Insert 'Almacén Principal'
      const { error: almacenError } = await adminClient.from("almacenes").insert({
        clinica_id: clinicaId,
        nombre: "Almacén Principal",
        is_default: true,
      });

      if (almacenError) {
        console.error("Error creating almacen:", almacenError);
      }

      // 4. Insert 3 basic items_catalogo
      const basicItems = [
        {
          clinica_id: clinicaId,
          nombre: "Consulta General",
          kind: "servicio",
          precio_inc: 0,
        },
        {
          clinica_id: clinicaId,
          nombre: "Vacuna",
          kind: "servicio",
          precio_inc: 0,
        },
        {
          clinica_id: clinicaId,
          nombre: "Desparasitante",
          kind: "producto",
          precio_inc: 0,
        },
      ];

      const { error: itemsError } = await adminClient
        .from("items_catalogo")
        .insert(basicItems);

      if (itemsError) {
        console.error("Error creating items_catalogo:", itemsError);
      }

      redirect("/inicio");
    }
  }

  redirect("/select-clinica");
}
