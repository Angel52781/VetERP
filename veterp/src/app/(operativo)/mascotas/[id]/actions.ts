"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import {
  MASCOTA_ADJUNTO_MIME_TYPES,
  subirAdjuntoMascotaSchema,
  type TipoAdjuntoMascota,
} from "@/lib/validators/adjuntos";
import {
  seguimientoClinicoSchema,
  seguimientoReprogramacionSchema,
  seguimientoResolucionSchema,
  SeguimientoClinicoInput,
} from "@/lib/validators/seguimiento";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

const SEGUIMIENTOS_TABLE = "seguimientos_clinicos";
const MASCOTA_ADJUNTOS_TABLE = "mascota_adjuntos";
const MASCOTA_ADJUNTO_BUCKET = "adjuntos";
const MASCOTA_ADJUNTO_SIGNED_URL_SECONDS = 3600;

type MascotaAdjuntoRow = {
  id: string;
  mascota_id: string;
  cliente_id: string | null;
  nombre_archivo_text: string;
  tipo_text: TipoAdjuntoMascota;
  storage_path_text: string;
  mime_type_text: string | null;
  size_bytes: number | null;
  notas_text: string | null;
  subido_por: string | null;
  created_at: string;
};

export type MascotaAdjunto = Omit<MascotaAdjuntoRow, "storage_path_text"> & {
  signed_url: string | null;
};

type SeguimientosLoadResult = {
  data: any[];
  unavailable: boolean;
  reason: string | null;
};

function isTableOrSchemaError(error: PostgrestError | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /schema cache|relation .* does not exist|table .* does not exist|seguimientos_clinicos/i.test(error.message)
  );
}

function revalidateSeguimientoPaths(row?: { mascota_id?: string | null; orden_id?: string | null } | null) {
  revalidatePath("/app");
  revalidatePath("/recordatorios");
  if (row?.mascota_id) {
    revalidatePath(`/mascotas/${row.mascota_id}`);
  }
  if (row?.orden_id) {
    revalidatePath(`/orden_y_colas/${row.orden_id}`);
  }
}

async function getCurrentUserId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

async function ensureMascotaInClinica(supabase: SupabaseClient, clinicaId: string, mascotaId: string) {
  const { data, error } = await supabase
    .from("mascotas")
    .select("id, cliente_id")
    .eq("id", mascotaId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as { id: string; cliente_id: string } | null;
}

async function signMascotaAdjunto(supabase: SupabaseClient, adjunto: MascotaAdjuntoRow): Promise<MascotaAdjunto> {
  const { storage_path_text, ...safeAdjunto } = adjunto;
  const { data, error } = await supabase.storage
    .from(MASCOTA_ADJUNTO_BUCKET)
    .createSignedUrl(storage_path_text, MASCOTA_ADJUNTO_SIGNED_URL_SECONDS);

  return {
    ...safeAdjunto,
    signed_url: error ? null : data?.signedUrl ?? null,
  };
}

function getExtensionForMime(mimeType: string) {
  const extensionByMime: Record<(typeof MASCOTA_ADJUNTO_MIME_TYPES)[number], string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return extensionByMime[mimeType as (typeof MASCOTA_ADJUNTO_MIME_TYPES)[number]] ?? "bin";
}

function getOriginalFileName(file: File) {
  const name = file.name?.trim();
  return name ? name.slice(0, 240) : "adjunto-clinico";
}

export async function resolverSeguimientoClinico(id: string, notas?: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = seguimientoResolucionSchema.parse({ id, notas });
    const userId = await getCurrentUserId(supabase);

    const { data, error } = await supabase
      .from(SEGUIMIENTOS_TABLE)
      .update({
        estado_text: "resuelto",
        resuelto_at: new Date().toISOString(),
        resuelto_por: userId,
        resolucion_notas_text: validated.notas?.trim() || null,
      })
      .eq("id", validated.id)
      .eq("clinica_id", clinicaId)
      .eq("estado_text", "pendiente")
      .select("id, mascota_id, orden_id")
      .maybeSingle();

    if (error) return { error: error.message, data: null };
    if (!data) return { error: "Solo se pueden resolver recordatorios pendientes de la clinica activa.", data: null };

    revalidateSeguimientoPaths(data);
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al resolver recordatorio", data: null };
  }
}

export async function cancelarSeguimientoClinico(id: string, notas?: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = seguimientoResolucionSchema.parse({ id, notas });
    const userId = await getCurrentUserId(supabase);

    const { data, error } = await supabase
      .from(SEGUIMIENTOS_TABLE)
      .update({
        estado_text: "cancelado",
        cancelado_at: new Date().toISOString(),
        cancelado_por: userId,
        resolucion_notas_text: validated.notas?.trim() || null,
      })
      .eq("id", validated.id)
      .eq("clinica_id", clinicaId)
      .eq("estado_text", "pendiente")
      .select("id, mascota_id, orden_id")
      .maybeSingle();

    if (error) return { error: error.message, data: null };
    if (!data) return { error: "Solo se pueden cancelar recordatorios pendientes de la clinica activa.", data: null };

    revalidateSeguimientoPaths(data);
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al cancelar recordatorio", data: null };
  }
}

export async function reprogramarSeguimientoClinico(id: string, nuevaFecha: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = seguimientoReprogramacionSchema.parse({ id, nuevaFecha });

    const { data, error } = await supabase
      .from(SEGUIMIENTOS_TABLE)
      .update({
        proxima_fecha_date: validated.nuevaFecha,
        estado_text: "pendiente",
      })
      .eq("id", validated.id)
      .eq("clinica_id", clinicaId)
      .eq("estado_text", "pendiente")
      .select("id, mascota_id, orden_id")
      .maybeSingle();

    if (error) return { error: error.message, data: null };
    if (!data) {
      return {
        error: "Solo se pueden reprogramar recordatorios pendientes de la clinica activa.",
        data: null,
      };
    }

    revalidateSeguimientoPaths(data);
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al reprogramar recordatorio", data: null };
  }
}

function isMissingRpcFunctionError(error: PostgrestError | null) {
  if (!error) return false;
  return error.code === "PGRST202" || /Could not find the function/i.test(error.message);
}

async function querySeguimientos(
  supabase: SupabaseClient,
  clinicaId: string,
  mascotaId: string
) {
  return supabase
    .from(SEGUIMIENTOS_TABLE)
    .select(`
      id, orden_id, tipo_text, nombre_text, estado_text,
      fecha_aplicacion_date, proxima_fecha_date, notas_text, resolucion_notas_text,
      resuelto_at, cancelado_at, created_at
    `)
    .eq("clinica_id", clinicaId)
    .eq("mascota_id", mascotaId)
    .order("fecha_aplicacion_date", { ascending: false })
    .order("created_at", { ascending: false });
}

async function refreshSchemaCache(supabase: SupabaseClient) {
  const { error } = await supabase.rpc("reload_postgrest_schema_cache");
  if (isMissingRpcFunctionError(error)) {
    return { refreshed: false, error: null };
  }
  return { refreshed: !error, error };
}

function buildSeguimientosUnavailableMessage() {
  return "Seguimientos clínicos no disponible: falta aplicar la migración 0013_seguimientos_clinicos.sql";
}

async function loadSeguimientosWithRecovery(
  supabase: SupabaseClient,
  clinicaId: string,
  mascotaId: string
): Promise<SeguimientosLoadResult> {
  const firstAttempt = await querySeguimientos(supabase, clinicaId, mascotaId);
  if (!firstAttempt.error) {
    return {
      data: firstAttempt.data ?? [],
      unavailable: false,
      reason: null,
    };
  }

  if (!isTableOrSchemaError(firstAttempt.error)) {
    console.warn("[getMascotaCompleta] error no crítico cargando seguimientos:", firstAttempt.error.message);
    return {
      data: [],
      unavailable: false,
      reason: null,
    };
  }

  if (firstAttempt.error.code === "42P01") {
    return {
      data: [],
      unavailable: true,
      reason: buildSeguimientosUnavailableMessage(),
    };
  }

  const refreshResult = await refreshSchemaCache(supabase);
  if (refreshResult.refreshed) {
    const retryAttempt = await querySeguimientos(supabase, clinicaId, mascotaId);
    if (!retryAttempt.error) {
      return {
        data: retryAttempt.data ?? [],
        unavailable: false,
        reason: null,
      };
    }

    if (retryAttempt.error.code === "42P01") {
      return {
        data: [],
        unavailable: true,
        reason: buildSeguimientosUnavailableMessage(),
      };
    }
  }

  console.warn("[getMascotaCompleta] seguimientos_clinicos con error temporal de cache:", firstAttempt.error.message);

  return {
    data: [],
    unavailable: false,
    reason: null,
  };
}

export async function getMascotaAdjuntos(mascotaId: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const mascota = await ensureMascotaInClinica(supabase, clinicaId, mascotaId);

    if (!mascota) {
      return { error: "La mascota no pertenece a la clinica activa.", data: [] as MascotaAdjunto[] };
    }

    const { data, error } = await supabase
      .from(MASCOTA_ADJUNTOS_TABLE)
      .select(`
        id,
        mascota_id,
        cliente_id,
        nombre_archivo_text,
        tipo_text,
        storage_path_text,
        mime_type_text,
        size_bytes,
        notas_text,
        subido_por,
        created_at
      `)
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", mascotaId)
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message, data: [] as MascotaAdjunto[] };
    }

    const adjuntos = await Promise.all(
      ((data ?? []) as MascotaAdjuntoRow[]).map((adjunto) => signMascotaAdjunto(supabase, adjunto)),
    );

    return { error: null, data: adjuntos };
  } catch (err: any) {
    return { error: err.message || "Error al cargar adjuntos clinicos", data: [] as MascotaAdjunto[] };
  }
}

export async function getMascotaAdjuntoSignedUrl(adjuntoId: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data: adjunto, error } = await supabase
      .from(MASCOTA_ADJUNTOS_TABLE)
      .select("id, storage_path_text")
      .eq("id", adjuntoId)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    if (error) {
      return { error: error.message, data: null };
    }
    if (!adjunto) {
      return { error: "Adjunto no encontrado para la clinica activa.", data: null };
    }

    const { data, error: signError } = await supabase.storage
      .from(MASCOTA_ADJUNTO_BUCKET)
      .createSignedUrl(adjunto.storage_path_text, MASCOTA_ADJUNTO_SIGNED_URL_SECONDS);

    if (signError || !data?.signedUrl) {
      return { error: signError?.message || "No se pudo generar el enlace firmado.", data: null };
    }

    return {
      error: null,
      data: {
        signedUrl: data.signedUrl,
        expiresIn: MASCOTA_ADJUNTO_SIGNED_URL_SECONDS,
      },
    };
  } catch (err: any) {
    return { error: err.message || "Error al generar enlace firmado", data: null };
  }
}

export async function uploadMascotaAdjunto(formData: FormData) {
  let uploadedPath: string | null = null;

  try {
    const validated = subirAdjuntoMascotaSchema.parse({
      mascota_id: formData.get("mascota_id"),
      tipo_text: formData.get("tipo_text"),
      notas_text: formData.get("notas_text"),
      file: formData.get("file"),
    });

    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const mascota = await ensureMascotaInClinica(supabase, clinicaId, validated.mascota_id);

    if (!mascota) {
      return { error: "La mascota no pertenece a la clinica activa.", data: null };
    }

    const userId = await getCurrentUserId(supabase);
    const adjuntoId = randomUUID();
    const fileExt = getExtensionForMime(validated.file.type);
    const filePath = `${clinicaId}/mascotas/${validated.mascota_id}/${adjuntoId}.${fileExt}`;
    uploadedPath = filePath;

    const { error: uploadError } = await supabase.storage
      .from(MASCOTA_ADJUNTO_BUCKET)
      .upload(filePath, validated.file, {
        contentType: validated.file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message || "Error al subir el archivo.", data: null };
    }

    const { data, error: insertError } = await supabase
      .from(MASCOTA_ADJUNTOS_TABLE)
      .insert({
        id: adjuntoId,
        clinica_id: clinicaId,
        mascota_id: validated.mascota_id,
        cliente_id: mascota.cliente_id,
        nombre_archivo_text: getOriginalFileName(validated.file),
        tipo_text: validated.tipo_text,
        storage_path_text: filePath,
        mime_type_text: validated.file.type,
        size_bytes: validated.file.size,
        notas_text: validated.notas_text ?? null,
        subido_por: userId,
      })
      .select("id")
      .single();

    if (insertError) {
      await supabase.storage.from(MASCOTA_ADJUNTO_BUCKET).remove([filePath]);
      uploadedPath = null;
      return { error: insertError.message, data: null };
    }

    revalidatePath(`/mascotas/${validated.mascota_id}`);
    return { error: null, data };
  } catch (err: any) {
    if (uploadedPath) {
      try {
        const supabase = await createClient();
        await supabase.storage.from(MASCOTA_ADJUNTO_BUCKET).remove([uploadedPath]);
      } catch {
        // No bloquea la respuesta: el error principal se reporta al usuario.
      }
    }

    return { error: err.message || "Error al subir adjunto clinico", data: null };
  }
}

export async function getMascotaCompleta(mascotaId: string) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const [mascotaRes, ordenesRes, citasRes, tiposCitaRes, hospitalizacionesRes, adjuntosRes] = await Promise.all([
    supabase
      .from("mascotas")
      .select(`
        *,
        clientes:cliente_id (id, nombre, telefono, email)
      `)
      .eq("clinica_id", clinicaId)
      .eq("id", mascotaId)
      .single(),
      
    supabase
      .from("ordenes_servicio")
      .select(`
        id, estado_text, created_at, started_at, finished_at,
        entradas_clinicas ( 
          id, orden_id, created_at, tipo_text, texto_text,
          motivo_consulta_text, peso_kg_num, temperatura_c_num,
          frecuencia_cardiaca_num, frecuencia_respiratoria_num,
          observaciones_text, diagnostico_text,
          anamnesis_text, plan_tratamiento_text,
          editado_at, editado_por, ediciones_count,
          entradas_clinicas_ediciones (
            id,
            entrada_clinica_id,
            editado_por,
            motivo_text,
            created_at
          )
        )
      `)
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", mascotaId)
      .order("created_at", { ascending: false }),

    supabase
      .from("citas")
      .select(`
        id, start_date, estado, notas_text,
        tipo_citas:tipo_cita_id (nombre, color)
      `)
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", mascotaId)
      .order("start_date", { ascending: false }),

    supabase
      .from("tipo_citas")
      .select("id, nombre, duracion_min")
      .eq("clinica_id", clinicaId)
      .order("nombre"),

    supabase
      .from("hospitalizaciones")
      .select(`
        id,
        estado_text,
        medico_tratante_text,
        motivo_text,
        diagnostico_presuntivo_text,
        internado_at,
        alta_at,
        alta_notas_text,
        created_at
      `)
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", mascotaId)
      .order("internado_at", { ascending: false }),

    supabase
      .from(MASCOTA_ADJUNTOS_TABLE)
      .select(`
        id,
        mascota_id,
        cliente_id,
        nombre_archivo_text,
        tipo_text,
        storage_path_text,
        mime_type_text,
        size_bytes,
        notas_text,
        subido_por,
        created_at
      `)
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", mascotaId)
      .order("created_at", { ascending: false }),
  ]);

  const seguimientos = await loadSeguimientosWithRecovery(supabase, clinicaId, mascotaId);
  const hospitalizaciones = hospitalizacionesRes.data ?? [];
  const hospitalizacionIds = hospitalizaciones.map((h: any) => h.id).filter(Boolean);
  const controlesRes = hospitalizacionIds.length
    ? await supabase
        .from("hospitalizacion_controles")
        .select(`
          id,
          hospitalizacion_id,
          temperatura_num,
          frecuencia_cardiaca_num,
          frecuencia_respiratoria_num,
          peso_num,
          deshidratacion_pct,
          mucosas_text,
          tlc_text,
          comio_bool,
          orino_bool,
          defeco_bool,
          observaciones_text,
          registrado_at
        `)
        .eq("clinica_id", clinicaId)
        .in("hospitalizacion_id", hospitalizacionIds)
        .order("registrado_at", { ascending: false })
    : { data: [] as any[], error: null };

  const ultimoControlByHospitalizacion = new Map<string, any>();
  for (const control of controlesRes.data ?? []) {
    if (!ultimoControlByHospitalizacion.has(control.hospitalizacion_id)) {
      ultimoControlByHospitalizacion.set(control.hospitalizacion_id, control);
    }
  }

  const adjuntos = adjuntosRes.error
    ? []
    : await Promise.all(
        ((adjuntosRes.data ?? []) as MascotaAdjuntoRow[]).map((adjunto) => signMascotaAdjunto(supabase, adjunto)),
      );

  return { 
    mascota: mascotaRes.data, 
    ordenes: ordenesRes.data ?? [],
    citas: citasRes.data ?? [],
    tiposCita: tiposCitaRes.data ?? [],
    adjuntos,
    seguimientos: seguimientos.data,
    hospitalizaciones: hospitalizaciones.map((hospitalizacion: any) => ({
      ...hospitalizacion,
      ultimo_control: ultimoControlByHospitalizacion.get(hospitalizacion.id) ?? null,
    })),
    seguimientoFeatureUnavailable: seguimientos.unavailable,
    seguimientoFeatureReason: seguimientos.reason,
    error: mascotaRes.error?.message || hospitalizacionesRes.error?.message || controlesRes.error?.message || adjuntosRes.error?.message
  };
}

export async function getSeguimientosMascota(mascotaId: string) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();
  const seguimientos = await loadSeguimientosWithRecovery(supabase, clinicaId, mascotaId);

  return {
    seguimientos: seguimientos.data,
    seguimientoFeatureUnavailable: seguimientos.unavailable,
    seguimientoFeatureReason: seguimientos.reason,
  };
}

export async function createSeguimientoClinico(input: SeguimientoClinicoInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = seguimientoClinicoSchema.parse(input);

    const { data: mascota } = await supabase
      .from("mascotas")
      .select("id")
      .eq("id", validated.mascota_id)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    if (!mascota) {
      return { error: "La mascota no pertenece a la clínica activa.", data: null };
    }

    if (validated.orden_id) {
      const { data: orden } = await supabase
        .from("ordenes_servicio")
        .select("id, mascota_id")
        .eq("id", validated.orden_id)
        .eq("clinica_id", clinicaId)
        .maybeSingle();

      if (!orden) {
        return { error: "La orden no pertenece a la clínica activa.", data: null };
      }
      if (orden.mascota_id !== validated.mascota_id) {
        return { error: "La orden no corresponde a la mascota seleccionada.", data: null };
      }
    }

    const insertPayload = {
      clinica_id: clinicaId,
      mascota_id: validated.mascota_id,
      orden_id: validated.orden_id ?? null,
      tipo_text: validated.tipo_text,
      nombre_text: validated.nombre_text.trim(),
      fecha_aplicacion_date: validated.fecha_aplicacion_date,
      proxima_fecha_date: validated.proxima_fecha_date ?? null,
      notas_text: validated.notas_text?.trim() || null,
      estado_text: validated.estado_text ?? "pendiente",
    };

    const firstAttempt = await supabase
      .from(SEGUIMIENTOS_TABLE)
      .insert(insertPayload)
      .select()
      .single();

    let data = firstAttempt.data;
    let error = firstAttempt.error;

    if (error && isTableOrSchemaError(error)) {
      if (error.code === "42P01") {
        return {
          error: buildSeguimientosUnavailableMessage(),
          data: null,
        };
      }

      await refreshSchemaCache(supabase);
      const retryAttempt = await supabase
        .from(SEGUIMIENTOS_TABLE)
        .insert(insertPayload)
        .select()
        .single();
      data = retryAttempt.data;
      error = retryAttempt.error;
    }

    if (error) {
      if (isTableOrSchemaError(error)) {
        if (error.code === "42P01") {
          return {
            error: buildSeguimientosUnavailableMessage(),
            data: null,
          };
        }
        return { error: error.message, data: null };
      }
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al registrar seguimiento clínico", data: null };
  }
}
