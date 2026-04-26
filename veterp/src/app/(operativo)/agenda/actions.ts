"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { tipoCitaSchema, citaSchema, TipoCitaInput, CitaInput } from "@/lib/validators/agenda";

export async function createTipoCita(input: TipoCitaInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const validatedData = tipoCitaSchema.parse(input);

    const { data, error } = await supabase
      .from("tipo_citas")
      .insert({
        ...validatedData,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tipo cita:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al crear tipo de cita", data: null };
  }
}

export async function createCita(input: CitaInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const validatedData = citaSchema.parse(input);

    // ensure dates are correctly passed
    const startDate = new Date(validatedData.start_date).toISOString();
    const endDate = new Date(validatedData.end_date).toISOString();

    const { data, error } = await supabase
      .from("citas")
      .insert({
        cliente_id: validatedData.cliente_id,
        mascota_id: validatedData.mascota_id,
        tipo_cita_id: validatedData.tipo_cita_id,
        start_date: startDate,
        end_date: endDate,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating cita:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al crear cita", data: null };
  }
}

export async function getTiposCita() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tipo_citas")
      .select("*")
      .eq("clinica_id", clinicaId)
      .order("nombre");

    if (error) {
      console.error("Error fetching tipos cita:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener tipos de cita", data: null };
  }
}

export async function getCitas(startDate: string, endDate: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    const { data, error } = await supabase
      .from("citas")
      .select(`
        *,
        clientes ( nombre ),
        mascotas ( nombre ),
        tipo_citas ( nombre, color )
      `)
      .eq("clinica_id", clinicaId)
      .gte("start_date", start)
      .lte("end_date", end)
      .order("start_date");

    if (error) {
      console.error("Error fetching citas:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener citas", data: null };
  }
}

export async function getClientesParaAgenda() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre")
      .eq("clinica_id", clinicaId)
      .order("nombre");

    if (error) {
      console.error("Error fetching clientes:", error);
      return { error: error?.message || "Error desconocido en BD", data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener clientes", data: null };
  }
}

export async function getMascotasDeCliente(clienteId: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("mascotas")
      .select("id, nombre")
      .eq("clinica_id", clinicaId)
      .eq("cliente_id", clienteId)
      .order("nombre");

    if (error) {
      console.error("Error fetching mascotas:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener mascotas", data: null };
  }
}
