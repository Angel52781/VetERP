"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { seguimientoClinicoSchema, SeguimientoClinicoInput } from "@/lib/validators/seguimiento";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

const SEGUIMIENTOS_TABLE = "seguimientos_clinicos";

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
      id, orden_id, tipo_text, nombre_text,
      fecha_aplicacion_date, proxima_fecha_date, notas_text, created_at
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

export async function getMascotaCompleta(mascotaId: string) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const [mascotaRes, ordenesRes, citasRes] = await Promise.all([
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
          anamnesis_text, plan_tratamiento_text
        )
      `)
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", mascotaId)
      .order("created_at", { ascending: false }),

    supabase
      .from("citas")
      .select(`
        id, start_date, estado,
        tipo_citas:tipo_cita_id (nombre, color)
      `)
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", mascotaId)
      .order("start_date", { ascending: false })
  ]);

  const seguimientos = await loadSeguimientosWithRecovery(supabase, clinicaId, mascotaId);

  return { 
    mascota: mascotaRes.data, 
    ordenes: ordenesRes.data ?? [],
    citas: citasRes.data ?? [],
    seguimientos: seguimientos.data,
    seguimientoFeatureUnavailable: seguimientos.unavailable,
    seguimientoFeatureReason: seguimientos.reason,
    error: mascotaRes.error?.message
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
