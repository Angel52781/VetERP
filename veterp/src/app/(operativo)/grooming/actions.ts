"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { guardarGroomingSchema, type GuardarGroomingInput } from "@/lib/validators/grooming";
import { startOfDay, endOfDay } from "date-fns";

// ─── getGroomingDia ────────────────────────────────────────────────────────────
// Lista todas las citas de hoy cuyo tipo_cita.area sea 'banos' o 'grooming',
// incluyendo el registro grooming_servicios asociado si existe.
export async function getGroomingDia() {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const now = new Date();
  const inicioHoy = startOfDay(now).toISOString();
  const finHoy = endOfDay(now).toISOString();

  const { data, error } = await supabase
    .from("citas")
    .select(`
      id, start_date, end_date, estado,
      tipo_citas:tipo_cita_id ( id, nombre, color, area ),
      clientes:cliente_id ( id, nombre, telefono ),
      mascotas:mascota_id (
        id, nombre, especie, raza,
        alertas_criticas, notas_manejo
      ),
      grooming_servicios (
        id, estado_text, observaciones_text,
        servicios_realizados_text, completado_at
      )
    `)
    .eq("clinica_id", clinicaId)
    .gte("start_date", inicioHoy)
    .lte("start_date", finHoy)
    .not("estado", "in", '("cancelada","no_asistio")')
    .order("start_date", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  // Filtrar solo áreas de grooming/banos en JS (join via select ya lo trae)
  const filtradas = (data ?? []).filter(
    (c: any) =>
      c.tipo_citas?.area === "banos" || c.tipo_citas?.area === "grooming"
  );

  return { data: filtradas, error: null };
}

// ─── upsertGroomingServicio ─────────────────────────────────────────────────
// Crear o actualizar el registro operativo grooming para una cita.
async function upsertGroomingServicio(
  input: GuardarGroomingInput,
  extras: { estado_text: "pendiente" | "completado"; completado_at: string | null; completado_por: string | null }
) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  // Validar que la cita pertenece a la clínica activa
  const { data: cita } = await supabase
    .from("citas")
    .select("id, mascota_id, cliente_id")
    .eq("id", input.cita_id)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  if (!cita) {
    return { error: "La cita no pertenece a la clínica activa.", data: null };
  }

  const payload = {
    clinica_id: clinicaId,
    cita_id: input.cita_id,
    mascota_id: cita.mascota_id,
    cliente_id: cita.cliente_id,
    observaciones_text: input.observaciones_text?.trim() || null,
    servicios_realizados_text: input.servicios_realizados_text?.trim() || null,
    estado_text: extras.estado_text,
    completado_at: extras.completado_at,
    completado_por: extras.completado_por,
  };

  const { data, error } = await supabase
    .from("grooming_servicios")
    .upsert(payload, { onConflict: "cita_id", ignoreDuplicates: false })
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  revalidatePath("/grooming");
  return { data, error: null };
}

// ─── guardarGroomingServicio ────────────────────────────────────────────────
export async function guardarGroomingServicio(input: GuardarGroomingInput) {
  const parsed = guardarGroomingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos.", data: null };
  }

  return upsertGroomingServicio(parsed.data, {
    estado_text: "pendiente",
    completado_at: null,
    completado_por: null,
  });
}

// ─── marcarGroomingCompletado ────────────────────────────────────────────────
export async function marcarGroomingCompletado(input: GuardarGroomingInput) {
  const parsed = guardarGroomingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos.", data: null };
  }

  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await upsertGroomingServicio(parsed.data, {
    estado_text: "completado",
    completado_at: new Date().toISOString(),
    completado_por: user?.id ?? null,
  });

  if (result.error) return result;

  // Sincronizar cita a 'completada' si no está en estado terminal
  const { data: cita } = await supabase
    .from("citas")
    .select("estado")
    .eq("id", parsed.data.cita_id)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  if (cita && !["cancelada", "no_asistio", "completada"].includes(cita.estado)) {
    await supabase
      .from("citas")
      .update({ estado: "completada" })
      .eq("id", parsed.data.cita_id)
      .eq("clinica_id", clinicaId);

    revalidatePath("/agenda");
  }

  return result;
}

// ─── marcarGroomingPendiente ─────────────────────────────────────────────────
export async function marcarGroomingPendiente(input: GuardarGroomingInput) {
  const parsed = guardarGroomingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos.", data: null };
  }

  return upsertGroomingServicio(parsed.data, {
    estado_text: "pendiente",
    completado_at: null,
    completado_por: null,
  });
  // Nota: NO revertimos cita.estado para no romper Agenda.
}
