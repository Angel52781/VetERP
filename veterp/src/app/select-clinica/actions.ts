"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clinicaCookieName } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const selectClinicaSchema = z.object({
  clinicaId: z.string().uuid(),
});

export type CreateClinicaState = { error: string | null };

export async function createClinica(): Promise<CreateClinicaState> {
  return {
    error: "La creacion manual de clinicas esta deshabilitada en este flujo.",
  };
}

async function upsertById(table: string, rows: Record<string, unknown>[]) {
  const supabase = await createClient();
  const result = await supabase.from(table).upsert(rows, { onConflict: "id" });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

async function seedDemoData(clinicaId: string) {
  const almacenId = "33333333-3333-3333-3333-333333333333";
  const proveedorId = "44444444-4444-4444-4444-444444444444";

  const itemConsultaId = "55555555-5555-5555-5555-555555555551";
  const itemVacunaId = "55555555-5555-5555-5555-555555555552";
  const itemDesparasitanteId = "55555555-5555-5555-5555-555555555553";

  await upsertById("almacenes", [
    {
      id: almacenId,
      clinica_id: clinicaId,
      nombre: "Almacen Principal",
      is_default: true,
    },
  ]);

  await upsertById("proveedores", [
    {
      id: proveedorId,
      clinica_id: clinicaId,
      nombre: "Proveedor Demo",
      contacto: "Juan Perez",
      telefono: "555-1234",
    },
  ]);

  await upsertById("items_catalogo", [
    {
      id: itemConsultaId,
      clinica_id: clinicaId,
      nombre: "Consulta General",
      descripcion: "Consulta general de rutina",
      kind: "servicio",
      precio_inc: 50,
      proveedor_id: null,
    },
    {
      id: itemVacunaId,
      clinica_id: clinicaId,
      nombre: "Vacuna Antirrabica",
      descripcion: "Vacuna anual",
      kind: "producto",
      precio_inc: 25,
      proveedor_id: proveedorId,
    },
    {
      id: itemDesparasitanteId,
      clinica_id: clinicaId,
      nombre: "Desparasitante Interno",
      descripcion: "Pastilla desparasitante",
      kind: "producto",
      precio_inc: 15,
      proveedor_id: proveedorId,
    },
  ]);

  const supabase = await createClient();
  const existingStock = await supabase
    .from("movimientos_stock")
    .select("id")
    .eq("clinica_id", clinicaId)
    .eq("notas", "Inventario inicial")
    .limit(1);

  if (existingStock.error) {
    throw new Error(existingStock.error.message);
  }

  if (!existingStock.data.length) {
    const insertStock = await supabase.from("movimientos_stock").insert([
      {
        clinica_id: clinicaId,
        item_id: itemVacunaId,
        almacen_id: almacenId,
        qty: 100,
        tipo: "entrada",
        notas: "Inventario inicial",
      },
      {
        clinica_id: clinicaId,
        item_id: itemDesparasitanteId,
        almacen_id: almacenId,
        qty: 200,
        tipo: "entrada",
        notas: "Inventario inicial",
      },
    ]);

    if (insertStock.error) {
      throw new Error(insertStock.error.message);
    }
  }
}

export async function selectClinica(formData: FormData) {
  const parsed = selectClinicaSchema.safeParse({
    clinicaId: formData.get("clinicaId"),
  });

  if (!parsed.success) {
    redirect("/select-clinica?error=invalid_clinic");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error } = await supabase
    .from("user_clinicas")
    .select("clinica_id")
    .eq("user_id", user.id)
    .eq("clinica_id", parsed.data.clinicaId)
    .maybeSingle();

  if (error || !membership) {
    redirect("/select-clinica?error=no_access");
  }

  const cookieStore = await cookies();
  cookieStore.set(clinicaCookieName, parsed.data.clinicaId, {
    path: "/",
    sameSite: "lax",
  });

  redirect("/app");
}

export async function bootstrapDemoAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await supabase
    .from("user_clinicas")
    .select("clinica_id")
    .eq("user_id", user.id);

  if (memberships.error) {
    redirect("/select-clinica?error=no_access");
  }

  let clinicaId = memberships.data[0]?.clinica_id ?? null;

  if (!clinicaId) {
    const createdClinica = await supabase.rpc("create_clinica", {
      p_nombre: "Clinica Demo",
    });

    if (createdClinica.error || !createdClinica.data) {
      redirect("/select-clinica?error=no_access");
    }

    clinicaId = createdClinica.data;
  }

  try {
    await seedDemoData(clinicaId);
  } catch {
    redirect("/select-clinica?error=no_access");
  }

  const cookieStore = await cookies();
  cookieStore.set(clinicaCookieName, clinicaId, {
    path: "/",
    sameSite: "lax",
  });

  redirect("/app");
}

export async function signOutFromSelectClinica() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);

  redirect("/login");
}
