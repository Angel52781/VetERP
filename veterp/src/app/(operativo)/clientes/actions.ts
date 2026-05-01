"use server";

import { revalidatePath } from "next/cache";

import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import {
  clienteSchema,
  mascotaSchema,
  type ClienteFormValues,
  type MascotaFormValues,
} from "@/lib/validators/clientes";

type ClienteActionResult = {
  error: string | null;
  clienteId?: string;
};

type MascotaActionResult = {
  error: string | null;
  mascotaId?: string;
};

export async function createCliente(input: ClienteFormValues): Promise<ClienteActionResult> {
  try {
    const parsed = clienteSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Datos de cliente invalidos." };
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
      return { error: "No se pudo crear el cliente en la clinica activa." };
    }

    revalidatePath("/clientes");
    return { error: null, clienteId: data.id };
  } catch {
    return { error: "No hay una clinica activa valida para crear clientes." };
  }
}

export async function updateCliente(clienteId: string, input: ClienteFormValues): Promise<ClienteActionResult> {
  try {
    const parsed = clienteSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Datos de cliente invalidos." };
    }

    const supabase = await createClient();
    const clinicaId = await requireClinicaIdFromCookies();

    const { data, error } = await supabase
      .from("clientes")
      .update({
        nombre: parsed.data.nombre,
        telefono: parsed.data.telefono || null,
        email: parsed.data.email || null,
      })
      .eq("id", clienteId)
      .eq("clinica_id", clinicaId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { error: "No se pudo actualizar el cliente en la clinica activa." };
    }

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clienteId}`);
    return { error: null, clienteId: data.id };
  } catch {
    return { error: "No hay una clinica activa valida para actualizar clientes." };
  }
}

export async function createMascota(clienteId: string, input: MascotaFormValues): Promise<MascotaActionResult> {
  try {
    const parsed = mascotaSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Datos de mascota invalidos." };
    }

    const supabase = await createClient();
    const clinicaId = await requireClinicaIdFromCookies();

    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", clienteId)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    if (!cliente) {
      return { error: "El cliente no pertenece a la clinica activa." };
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

    revalidatePath(`/clientes/${clienteId}`);
    return { error: null, mascotaId: data.id };
  } catch {
    return { error: "No hay una clinica activa valida para crear mascotas." };
  }
}

export async function updateMascota(mascotaId: string, input: MascotaFormValues): Promise<MascotaActionResult> {
  try {
    const parsed = mascotaSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Datos de paciente invalidos." };
    }

    const supabase = await createClient();
    const clinicaId = await requireClinicaIdFromCookies();

    const { data: mascota } = await supabase
      .from("mascotas")
      .select("id, cliente_id")
      .eq("id", mascotaId)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    if (!mascota) {
      return { error: "El paciente no pertenece a la clinica activa." };
    }

    const { data, error } = await supabase
      .from("mascotas")
      .update({
        nombre: parsed.data.nombre,
        especie: parsed.data.especie || null,
        raza: parsed.data.raza || null,
        nacimiento: parsed.data.nacimiento || null,
      })
      .eq("id", mascotaId)
      .eq("clinica_id", clinicaId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { error: "No se pudo actualizar el paciente." };
    }

    revalidatePath("/pacientes");
    revalidatePath(`/mascotas/${mascotaId}`);
    revalidatePath(`/clientes/${mascota.cliente_id}`);
    return { error: null, mascotaId: data.id };
  } catch {
    return { error: "No hay una clinica activa valida para actualizar pacientes." };
  }
}
