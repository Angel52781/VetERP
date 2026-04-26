"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clinicaCookieName } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const selectClinicaSchema = z.object({
  clinicaId: z
    .string()
    .trim()
    .min(1, "Clinica requerida"),
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
  const almacenId = "33333333-3333-4333-a333-333333333333";
  const proveedorId = "44444444-4444-4444-a444-444444444444";

  const itemConsultaId = "55555555-5555-4555-a555-555555555551";
  const itemVacunaId = "55555555-5555-4555-a555-555555555552";
  const itemDesparasitanteId = "55555555-5555-4555-a555-555555555553";

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

  // Seed Clientes
  const cliente1Id = "aa000000-0000-4000-a000-000000000001";
  const cliente2Id = "aa000000-0000-4000-a000-000000000002";
  const cliente3Id = "aa000000-0000-4000-a000-000000000003";

  await upsertById("clientes", [
    { id: cliente1Id, clinica_id: clinicaId, nombre: "María García López", telefono: "555-0101", email: "maria.garcia@email.com" },
    { id: cliente2Id, clinica_id: clinicaId, nombre: "Carlos Rodríguez Pérez", telefono: "555-0202", email: "carlos.r@email.com" },
    { id: cliente3Id, clinica_id: clinicaId, nombre: "Ana Martínez Soto", telefono: "555-0303", email: null },
  ]);

  // Seed Mascotas
  const mascota1Id = "bb000000-0000-4000-a000-000000000001";
  const mascota2Id = "bb000000-0000-4000-a000-000000000002";
  const mascota3Id = "bb000000-0000-4000-a000-000000000003";

  await upsertById("mascotas", [
    { id: mascota1Id, clinica_id: clinicaId, cliente_id: cliente1Id, nombre: "Luna", especie: "Perro", raza: "Labrador", nacimiento: "2020-03-15" },
    { id: mascota2Id, clinica_id: clinicaId, cliente_id: cliente1Id, nombre: "Michi", especie: "Gato", raza: "Siamés", nacimiento: "2021-07-20" },
    { id: mascota3Id, clinica_id: clinicaId, cliente_id: cliente2Id, nombre: "Max", especie: "Perro", raza: "Pastor Alemán", nacimiento: "2019-11-05" },
  ]);

  // Seed Tipos de Cita
  const tipoCita1Id = "cc000000-0000-4000-a000-000000000001";
  const tipoCita2Id = "cc000000-0000-4000-a000-000000000002";

  await upsertById("tipo_citas", [
    { id: tipoCita1Id, clinica_id: clinicaId, nombre: "Consulta General", duracion_min: 30, color: "#3B82F6" },
    { id: tipoCita2Id, clinica_id: clinicaId, nombre: "Vacunación", duracion_min: 20, color: "#10B981" },
  ]);

  // Check if citas exist to avoid overriding today's dates infinitely
  const existingCitas = await supabase.from("citas").select("id").eq("clinica_id", clinicaId).limit(1);
  if (!existingCitas.error && !existingCitas.data.length) {
    const now = new Date();
    const addHours = (date: Date, h: number) => new Date(date.getTime() + h * 60 * 60 * 1000).toISOString();
    
    await supabase.from("citas").insert([
      { clinica_id: clinicaId, cliente_id: cliente1Id, mascota_id: mascota1Id, tipo_cita_id: tipoCita1Id, estado: "programada", start_date: addHours(now, 1), end_date: addHours(now, 1.5) },
      { clinica_id: clinicaId, cliente_id: cliente2Id, mascota_id: mascota3Id, tipo_cita_id: tipoCita2Id, estado: "programada", start_date: addHours(now, 24), end_date: addHours(now, 24.3) },
    ]);
  }

  // Check if ordenes exist
  const existingOrdenes = await supabase.from("ordenes_servicio").select("id").eq("clinica_id", clinicaId).limit(1);
  if (!existingOrdenes.error && !existingOrdenes.data.length) {
    const orden1Id = "ee000000-0000-4000-a000-000000000001";
    await supabase.from("ordenes_servicio").insert([
      { id: orden1Id, clinica_id: clinicaId, cliente_id: cliente1Id, mascota_id: mascota1Id, estado_text: "open", started_at: new Date(Date.now() - 15*60000).toISOString() }
    ]);
  }
}

export async function selectClinica(formData: FormData) {
  const rawClinicaId =
    formData.get("clinicaId") ??
    formData.get("clinica_id") ??
    formData.get("clinicId");

  const parsed = selectClinicaSchema.safeParse({
    clinicaId: rawClinicaId,
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
