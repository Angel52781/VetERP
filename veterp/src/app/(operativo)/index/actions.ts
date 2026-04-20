"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { ordenServicioSchema, OrdenServicioInput } from "@/lib/validators/atencion";

export async function createOrdenServicio(input: OrdenServicioInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const validatedData = ordenServicioSchema.parse(input);
    const supabase = await createClient();

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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ordenes servicio:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in getOrdenesServicio:", error);
    return { error: error.message || "Error al obtener las órdenes de servicio", data: null };
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
