"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import {
  clienteSchema,
  mascotaSchema,
  type ClienteFormValues,
  type MascotaFormValues,
} from "@/lib/validators/clientes";

export async function createCliente(
  input: ClienteFormValues,
): Promise<{ error: string | null; clienteId?: string }> {
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      clinica_id: clinicaId,
      nombre: parsed.data.nombre,
      telefono: parsed.data.telefono || null,
      email: parsed.data.email || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No se pudo crear el cliente." };
  }

  return { error: null, clienteId: data.id };
}

export async function createMascota(
  clienteId: string,
  input: MascotaFormValues,
): Promise<{ error: string | null; mascotaId?: string }> {
  const parsed = mascotaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id,clinica_id")
    .eq("id", clienteId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  if (!cliente) {
    return { error: "Cliente no encontrado." };
  }

  const { data, error } = await supabase
    .from("mascotas")
    .insert({
      clinica_id: clinicaId,
      cliente_id: clienteId,
      nombre: parsed.data.nombre,
      especie: parsed.data.especie || null,
      raza: parsed.data.raza || null,
      nacimiento: parsed.data.nacimiento || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No se pudo crear la mascota." };
  }

  return { error: null, mascotaId: data.id };
}
