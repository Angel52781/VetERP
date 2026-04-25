"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies, requireUserRole } from "@/lib/clinica";
import { 
  itemCatalogoSchema, 
  ItemCatalogoInput,
  proveedorSchema,
  ProveedorInput,
  almacenSchema,
  AlmacenInput,
  clinicaBrandingSchema,
  ClinicaBrandingInput,
  categoriaSchema,
  CategoriaInput
} from "@/lib/validators/ajustes";

export async function getItemsCatalogo() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("items_catalogo")
      .select(`
        *,
        proveedores ( nombre ),
        categorias_catalogo ( nombre )
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
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
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
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
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

export async function getCategorias() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categorias_catalogo")
      .select("*")
      .eq("clinica_id", clinicaId)
      .order("nombre");

    if (error) {
      console.error("Error fetching categorias:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener categorías", data: null };
  }
}

export async function createCategoria(input: CategoriaInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = categoriaSchema.parse(input);

    const { data, error } = await supabase
      .from("categorias_catalogo")
      .insert({
        ...validatedData,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating categoria:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al crear categoría", data: null };
  }
}

export async function updateCategoria(id: string, input: CategoriaInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = categoriaSchema.parse(input);

    const { data, error } = await supabase
      .from("categorias_catalogo")
      .update({
        ...validatedData,
      })
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating categoria:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar categoría", data: null };
  }
}

export async function getProveedores() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("proveedores")
      .select("*")
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

export async function createProveedor(input: ProveedorInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = proveedorSchema.parse(input);

    const { data, error } = await supabase
      .from("proveedores")
      .insert({
        ...validatedData,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating proveedor:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al crear proveedor", data: null };
  }
}

export async function updateProveedor(id: string, input: ProveedorInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = proveedorSchema.parse(input);

    const { data, error } = await supabase
      .from("proveedores")
      .update({
        ...validatedData,
      })
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating proveedor:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar proveedor", data: null };
  }
}

export async function getAlmacenes() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("almacenes")
      .select("*")
      .eq("clinica_id", clinicaId)
      .order("nombre");

    if (error) {
      console.error("Error fetching almacenes:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener almacenes", data: null };
  }
}

export async function createAlmacen(input: AlmacenInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = almacenSchema.parse(input);

    const { data, error } = await supabase
      .from("almacenes")
      .insert({
        ...validatedData,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating almacen:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al crear almacén", data: null };
  }
}

export async function updateAlmacen(id: string, input: AlmacenInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = almacenSchema.parse(input);

    const { data, error } = await supabase
      .from("almacenes")
      .update({
        ...validatedData,
      })
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating almacen:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar almacén", data: null };
  }
}

export async function getClinicaBranding() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clinicas")
      .select("*")
      .eq("id", clinicaId)
      .single();

    if (error) {
      console.error("Error fetching clinica branding:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener branding", data: null };
  }
}

export async function updateClinicaBranding(input: ClinicaBrandingInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = clinicaBrandingSchema.parse(input);

    const { data, error } = await supabase
      .from("clinicas")
      .update({
        ...validatedData,
      })
      .eq("id", clinicaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating clinica branding:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar branding", data: null };
  }
}

export async function uploadClinicaLogo(formData: FormData) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No se proporciono ningun archivo", data: null };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${clinicaId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("branding")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading logo:", error);
      return { error: error.message, data: null };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("branding")
      .getPublicUrl(fileName);

    // Update the clinic record with the new logo URL
    await supabase
      .from("clinicas")
      .update({ logo_url: publicUrl })
      .eq("id", clinicaId);

    return { error: null, data: publicUrl };
  } catch (err: any) {
    return { error: err.message || "Error al subir logo", data: null };
  }
}
