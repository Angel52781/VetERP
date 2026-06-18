"use server";

import { revalidatePath } from "next/cache";

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
  CategoriaInput,
  aparienciaClinicaSchema,
  AparienciaClinicaInput,
  temaGuardadoClinicaSchema,
  TemaGuardadoClinicaInput,
} from "@/lib/validators/ajustes";

const DEFAULT_APARIENCIA: AparienciaClinicaInput = {
  theme_preset_text: "default",
  brand_color_text: null,
};

const APARIENCIA_UNAVAILABLE_MESSAGE =
  "La configuracion de apariencia no esta disponible; aplica migracion 0034 o recarga schema cache.";
const TEMAS_GUARDADOS_UNAVAILABLE_MESSAGE =
  "Los temas guardados no estan disponibles; aplica migracion 0035 o recarga schema cache.";
const APARIENCIA_PERMISSION_MESSAGE = "No tienes permisos para modificar la apariencia.";

export type ClinicaTemaGuardado = {
  id: string;
  nombre_text: string;
  theme_preset_text: AparienciaClinicaInput["theme_preset_text"];
  brand_color_text: string;
  orden_int: number;
  created_at: string;
  updated_at: string;
};

function revalidateAppearancePaths() {
  revalidatePath("/ajustes");
  revalidatePath("/app");
}

function describeSupabaseError(error: any) {
  if (!error || typeof error !== "object") {
    return String(error);
  }

  const details = {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  };

  return JSON.stringify(details, null, 2);
}

function isAppearanceSchemaUnavailable(error: any) {
  const details = describeSupabaseError(error).toLowerCase();

  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    details.includes("schema cache") ||
    details.includes("theme_preset_text") ||
    details.includes("brand_color_text")
  );
}

function isTemasGuardadosSchemaUnavailable(error: any) {
  const details = describeSupabaseError(error).toLowerCase();

  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    details.includes("schema cache") ||
    details.includes("clinica_temas_guardados")
  );
}

function isPermissionError(error: any) {
  const message = error?.message?.toLowerCase?.() ?? "";
  return message.includes("acceso denegado") || message.includes("permission") || message.includes("permis");
}

function normalizeAppearanceActionError(error: any, fallback: string) {
  if (isPermissionError(error)) {
    return APARIENCIA_PERMISSION_MESSAGE;
  }

  return error?.message || fallback;
}

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

export async function getClinicaApariencia() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clinicas")
      .select("theme_preset_text, brand_color_text")
      .eq("id", clinicaId)
      .maybeSingle();

    if (error) {
      const message = isAppearanceSchemaUnavailable(error)
        ? APARIENCIA_UNAVAILABLE_MESSAGE
        : error.message || "No se pudo cargar la apariencia de la clinica.";

      console.warn("Error fetching clinica appearance:", describeSupabaseError(error));

      return { error: message, data: DEFAULT_APARIENCIA };
    }

    if (!data) {
      return { error: null, data: DEFAULT_APARIENCIA };
    }

    const parsed = aparienciaClinicaSchema.safeParse({
      theme_preset_text: data?.theme_preset_text ?? DEFAULT_APARIENCIA.theme_preset_text,
      brand_color_text: data?.brand_color_text ?? DEFAULT_APARIENCIA.brand_color_text,
    });

    if (!parsed.success) {
      return { error: "La apariencia guardada no es valida. Se usaran valores predeterminados.", data: DEFAULT_APARIENCIA };
    }

    return { error: null, data: parsed.data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener apariencia", data: DEFAULT_APARIENCIA };
  }
}

export async function listClinicaTemasGuardados() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clinica_temas_guardados")
      .select("id, nombre_text, theme_preset_text, brand_color_text, orden_int, created_at, updated_at")
      .eq("clinica_id", clinicaId)
      .order("orden_int", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Error fetching saved themes:", describeSupabaseError(error));
      return {
        error: isTemasGuardadosSchemaUnavailable(error)
          ? TEMAS_GUARDADOS_UNAVAILABLE_MESSAGE
          : error.message || "No se pudieron cargar los temas guardados.",
        data: [] as ClinicaTemaGuardado[],
      };
    }

    return { error: null, data: (data ?? []) as ClinicaTemaGuardado[] };
  } catch (err: any) {
    return { error: err.message || "Error al obtener temas guardados", data: [] as ClinicaTemaGuardado[] };
  }
}

export async function createClinicaTemaGuardado(input: TemaGuardadoClinicaInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const parsed = temaGuardadoClinicaSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "El tema guardado no es valido.",
        data: null,
      };
    }

    const { count, error: countError } = await supabase
      .from("clinica_temas_guardados")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", clinicaId);

    if (countError) {
      console.error("Error counting saved themes:", describeSupabaseError(countError));
      return {
        error: isTemasGuardadosSchemaUnavailable(countError)
          ? TEMAS_GUARDADOS_UNAVAILABLE_MESSAGE
          : countError.message || "No se pudo validar el limite de temas guardados.",
        data: null,
      };
    }

    if ((count ?? 0) >= 10) {
      return { error: "Solo puedes guardar hasta 10 temas.", data: null };
    }

    const { data, error } = await supabase
      .from("clinica_temas_guardados")
      .insert({
        ...parsed.data,
        clinica_id: clinicaId,
      })
      .select("id, nombre_text, theme_preset_text, brand_color_text, orden_int, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error creating saved theme:", describeSupabaseError(error));
      return {
        error: isTemasGuardadosSchemaUnavailable(error)
          ? TEMAS_GUARDADOS_UNAVAILABLE_MESSAGE
          : error.message || "No se pudo guardar el tema.",
        data: null,
      };
    }

    revalidatePath("/ajustes");

    return { error: null, data: data as ClinicaTemaGuardado };
  } catch (err: any) {
    return { error: normalizeAppearanceActionError(err, "Error al guardar tema"), data: null };
  }
}

export async function applyClinicaTemaGuardado(id: string) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const { data: tema, error: themeError } = await supabase
      .from("clinica_temas_guardados")
      .select("theme_preset_text, brand_color_text")
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    if (themeError) {
      console.error("Error loading saved theme:", describeSupabaseError(themeError));
      return {
        error: isTemasGuardadosSchemaUnavailable(themeError)
          ? TEMAS_GUARDADOS_UNAVAILABLE_MESSAGE
          : themeError.message || "No se pudo cargar el tema guardado.",
        data: null,
      };
    }

    if (!tema) {
      return { error: "Tema guardado no encontrado.", data: null };
    }

    const { data, error } = await supabase
      .from("clinicas")
      .update({
        theme_preset_text: tema.theme_preset_text,
        brand_color_text: tema.brand_color_text,
      })
      .eq("id", clinicaId)
      .select("theme_preset_text, brand_color_text")
      .single();

    if (error) {
      console.error("Error applying saved theme:", describeSupabaseError(error));
      return {
        error: isAppearanceSchemaUnavailable(error)
          ? APARIENCIA_UNAVAILABLE_MESSAGE
          : error.message || "No se pudo aplicar el tema guardado.",
        data: null,
      };
    }

    revalidateAppearancePaths();

    return { error: null, data };
  } catch (err: any) {
    return { error: normalizeAppearanceActionError(err, "Error al aplicar tema"), data: null };
  }
}

export async function deleteClinicaTemaGuardado(id: string) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const { error } = await supabase
      .from("clinica_temas_guardados")
      .delete()
      .eq("id", id)
      .eq("clinica_id", clinicaId);

    if (error) {
      console.error("Error deleting saved theme:", describeSupabaseError(error));
      return {
        error: isTemasGuardadosSchemaUnavailable(error)
          ? TEMAS_GUARDADOS_UNAVAILABLE_MESSAGE
          : error.message || "No se pudo eliminar el tema guardado.",
        data: null,
      };
    }

    revalidatePath("/ajustes");

    return { error: null, data: { id } };
  } catch (err: any) {
    return { error: normalizeAppearanceActionError(err, "Error al eliminar tema"), data: null };
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

export async function updateClinicaApariencia(input: AparienciaClinicaInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const parsed = aparienciaClinicaSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "La apariencia enviada no es valida.",
        data: null,
      };
    }

    const validatedData = parsed.data;

    const { data, error } = await supabase
      .from("clinicas")
      .update({
        theme_preset_text: validatedData.theme_preset_text,
        brand_color_text: validatedData.brand_color_text,
      })
      .eq("id", clinicaId)
      .select("theme_preset_text, brand_color_text")
      .single();

    if (error) {
      console.error("Error updating clinica appearance:", describeSupabaseError(error));
      return {
        error: isAppearanceSchemaUnavailable(error)
          ? APARIENCIA_UNAVAILABLE_MESSAGE
          : error.message || "Error al actualizar apariencia",
        data: null,
      };
    }

    revalidateAppearancePaths();

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar apariencia", data: null };
  }
}

export async function restoreClinicaApariencia() {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clinicas")
      .update(DEFAULT_APARIENCIA)
      .eq("id", clinicaId)
      .select("theme_preset_text, brand_color_text")
      .single();

    if (error) {
      console.error("Error restoring clinica appearance:", describeSupabaseError(error));
      return {
        error: isAppearanceSchemaUnavailable(error)
          ? APARIENCIA_UNAVAILABLE_MESSAGE
          : error.message || "Error al restaurar apariencia",
        data: null,
      };
    }

    revalidateAppearancePaths();

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al restaurar apariencia", data: null };
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
