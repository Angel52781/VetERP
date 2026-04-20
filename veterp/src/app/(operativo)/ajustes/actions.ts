"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { itemCatalogoSchema, ItemCatalogoInput } from "@/lib/validators/ajustes";

export async function getItemsCatalogo() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("items_catalogo")
      .select(`
        *,
        proveedores ( nombre )
      `)
      .eq("clinica_id", clinicaId)
      .order("nombre");

    if (error) {
      console.error("Error fetching items catalogo:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener items", data: null };
  }
}

export async function createItemCatalogo(input: ItemCatalogoInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const validatedData = itemCatalogoSchema.parse(input);

    const { data, error } = await supabase
      .from("items_catalogo")
      .insert({
        ...validatedData,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating item catalogo:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al crear ítem", data: null };
  }
}

export async function updateItemCatalogo(id: string, input: ItemCatalogoInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const validatedData = itemCatalogoSchema.parse(input);

    const { data, error } = await supabase
      .from("items_catalogo")
      .update({
        ...validatedData,
      })
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating item catalogo:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar ítem", data: null };
  }
}

export async function getProveedores() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("proveedores")
      .select("id, nombre")
      .eq("clinica_id", clinicaId)
      .order("nombre");

    if (error) {
      console.error("Error fetching proveedores:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener proveedores", data: null };
  }
}
