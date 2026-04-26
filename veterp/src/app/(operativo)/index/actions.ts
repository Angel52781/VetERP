"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { ordenServicioSchema, OrdenServicioInput } from "@/lib/validators/atencion";

export async function createOrdenServicio(input: OrdenServicioInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const validatedData = ordenServicioSchema.parse(input);
    const supabase = await createClient();

    const { data: existingActiveOrder } = await supabase
      .from("ordenes_servicio")
      .select("id")
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", validatedData.mascota_id)
      .in("estado_text", ["open", "in_progress"])
      .maybeSingle();

    if (existingActiveOrder) {
      return { error: "Esta mascota ya tiene una atención activa en sala de espera o en progreso.", data: null };
    }

    const { data, error } = await supabase
      .from("ordenes_servicio")
      .insert({
        clinica_id: clinicaId,
        cliente_id: validatedData.cliente_id,
        mascota_id: validatedData.mascota_id,
        estado_text: "open",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating orden servicio:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in createOrdenServicio:", error);
    return { error: error.message || "Error al crear la orden de servicio", data: null };
  }
}

/** Devuelve solo órdenes activas (open / in_progress) para la pantalla de Atenciones. */
export async function getOrdenesServicio() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ordenes_servicio")
      .select(`
        *,
        clientes:cliente_id (
          id,
          nombre
        ),
        mascotas:mascota_id (
          id,
          nombre
        )
      `)
      .eq("clinica_id", clinicaId)
      .in("estado_text", ["open", "in_progress"])
      .order("started_at", { ascending: true });

    if (error) {
      console.error("Error fetching ordenes activas:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in getOrdenesServicio:", error);
    return { error: error.message || "Error al obtener las órdenes de servicio", data: null };
  }
}

/** Devuelve todo el historial de órdenes sin filtrar por estado. */
export async function getAllOrdenesServicio() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ordenes_servicio")
      .select(`
        *,
        clientes:cliente_id (
          id,
          nombre
        ),
        mascotas:mascota_id (
          id,
          nombre
        )
      `)
      .eq("clinica_id", clinicaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching historial ordenes:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in getAllOrdenesServicio:", error);
    return { error: error.message || "Error al obtener el historial de órdenes", data: null };
  }
}

export async function updateEstadoOrden(id: string, estado: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const updateData: any = { estado_text: estado };
    if (estado === "finished" || estado === "closed") {
      updateData.finished_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("ordenes_servicio")
      .update(updateData)
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating estado orden:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in updateEstadoOrden:", error);
    return { error: error.message || "Error al actualizar el estado de la orden", data: null };
  }
}
