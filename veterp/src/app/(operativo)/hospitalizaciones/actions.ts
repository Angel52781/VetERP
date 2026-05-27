"use server";

import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import {
  altaHospitalizacionSchema,
  cambiarEstadoTratamientoHospitalizacionSchema,
  createHospitalizacionControlSchema,
  createHospitalizacionSchema,
  createTratamientoHospitalizacionSchema,
  updateTratamientoHospitalizacionSchema,
  type AltaHospitalizacionInput,
  type CambiarEstadoTratamientoHospitalizacionInput,
  type CreateHospitalizacionControlInput,
  type CreateHospitalizacionInput,
  type CreateTratamientoHospitalizacionInput,
  type UpdateTratamientoHospitalizacionInput,
} from "@/lib/validators/hospitalizaciones";
import type { PostgrestError } from "@supabase/supabase-js";

type HospitalizacionRow = {
  id: string;
  mascota_id: string;
  cliente_id: string;
  estado_text: string;
  internado_at: string;
  alta_at: string | null;
  alta_notas_text: string | null;
};

type TratamientoHospitalizacionRow = {
  id: string;
  hospitalizacion_id: string;
  mascota_id: string;
  estado_text: string;
  notas_text: string | null;
};

function logSupabaseError(context: string, error: unknown) {
  console.error(context, JSON.stringify(error, null, 2));
}

function isMissingRpcFunctionError(error: PostgrestError | null) {
  if (!error) return false;
  return error.code === "PGRST202" || /Could not find the function/i.test(error.message);
}

function isTableOrSchemaError(error: PostgrestError | null, tableName: string) {
  if (!error) return false;
  const message = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
  return (
    error.code === "42P01" ||
    error.code === "PGRST200" ||
    error.code === "PGRST205" ||
    /schema cache|relation .* does not exist|table .* does not exist|Could not find the table/i.test(message) ||
    message.includes(tableName)
  );
}

async function refreshSchemaCache(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.rpc("reload_postgrest_schema_cache");
  if (isMissingRpcFunctionError(error)) {
    return { refreshed: false, error: null };
  }
  return { refreshed: !error, error };
}

function buildTratamientosUnavailableMessage() {
  return "Tratamientos de hospitalizacion no disponible: aplica migracion 0029 o recarga schema cache.";
}

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateHospitalizacionPaths(
  row?: { id?: string | null; hospitalizacion_id?: string | null; mascota_id?: string | null } | null,
) {
  revalidatePath("/hospitalizaciones");
  const hospitalizacionId = row?.hospitalizacion_id ?? row?.id;
  if (hospitalizacionId) {
    revalidatePath(`/hospitalizaciones/${hospitalizacionId}`);
  }
  if (row?.mascota_id) {
    revalidatePath(`/mascotas/${row.mascota_id}`);
  }
}

function appendNotasTratamiento(
  current: string | null | undefined,
  incoming: string | null | undefined,
) {
  const nextNota = cleanText(incoming);
  const currentNota = cleanText(current);
  if (!nextNota) return currentNota;
  if (!currentNota) return nextNota;
  return `${currentNota}\n${nextNota}`;
}

async function getHospitalizacionActiva(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicaId: string,
  id: string,
) {
  const { data } = await supabase
    .from("hospitalizaciones")
    .select("id, mascota_id, cliente_id, estado_text, internado_at, alta_at, alta_notas_text")
    .eq("id", id)
    .eq("clinica_id", clinicaId)
    .eq("estado_text", "activa")
    .maybeSingle();

  return data as HospitalizacionRow | null;
}

async function getTratamientoHospitalizacion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicaId: string,
  id: string,
) {
  const { data } = await supabase
    .from("hospitalizacion_tratamientos")
    .select("id, hospitalizacion_id, mascota_id, estado_text, notas_text")
    .eq("id", id)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  return data as TratamientoHospitalizacionRow | null;
}

export async function getHospitalizaciones() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const hoy = new Date();

    const [
      hospitalizacionesRes,
      pacientesRes,
      controlesHoyRes,
    ] = await Promise.all([
      supabase
        .from("hospitalizaciones")
        .select(`
          id,
          clinica_id,
          mascota_id,
          cliente_id,
          medico_tratante_text,
          motivo_text,
          diagnostico_presuntivo_text,
          estado_text,
          internado_at,
          alta_at,
          alta_notas_text,
          created_at,
          updated_at,
          mascotas:mascota_id (
            id,
            nombre,
            codigo_text,
            especie,
            raza,
            alertas_criticas,
            notas_manejo
          ),
          clientes:cliente_id (
            id,
            nombre,
            telefono
          )
        `)
        .eq("clinica_id", clinicaId)
        .in("estado_text", ["activa", "alta"])
        .order("internado_at", { ascending: false }),
      supabase
        .from("mascotas")
        .select(`
          id,
          nombre,
          codigo_text,
          especie,
          raza,
          cliente_id,
          alertas_criticas,
          notas_manejo,
          clientes:cliente_id (
            id,
            nombre,
            telefono
          )
        `)
        .eq("clinica_id", clinicaId)
        .order("nombre"),
      supabase
        .from("hospitalizacion_controles")
        .select("id", { count: "exact", head: true })
        .eq("clinica_id", clinicaId)
        .gte("registrado_at", startOfDay(hoy).toISOString())
        .lte("registrado_at", endOfDay(hoy).toISOString()),
    ]);

    if (hospitalizacionesRes.error) {
      logSupabaseError("[getHospitalizaciones] hospitalizaciones error", hospitalizacionesRes.error);
      return { error: hospitalizacionesRes.error.message, data: null };
    }
    if (pacientesRes.error) {
      logSupabaseError("[getHospitalizaciones] pacientes error", pacientesRes.error);
      return { error: pacientesRes.error.message, data: null };
    }
    if (controlesHoyRes.error) {
      logSupabaseError("[getHospitalizaciones] controlesHoy error", controlesHoyRes.error);
      return { error: controlesHoyRes.error.message, data: null };
    }

    const hospitalizaciones = hospitalizacionesRes.data ?? [];
    const hospitalizacionIds = hospitalizaciones.map((h) => h.id).filter(Boolean);

    const controlesRes = hospitalizacionIds.length
      ? await supabase
          .from("hospitalizacion_controles")
          .select(`
            id,
            clinica_id,
            hospitalizacion_id,
            mascota_id,
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
            registrado_at,
            created_at
          `)
          .eq("clinica_id", clinicaId)
          .in("hospitalizacion_id", hospitalizacionIds)
          .order("registrado_at", { ascending: false })
      : { data: [], error: null };

    if (controlesRes.error) {
      logSupabaseError("[getHospitalizaciones] controles error", controlesRes.error);
      return { error: controlesRes.error.message, data: null };
    }

    const ultimoControlByHospitalizacion = new Map<string, unknown>();
    for (const control of controlesRes.data ?? []) {
      if (!ultimoControlByHospitalizacion.has(control.hospitalizacion_id)) {
        ultimoControlByHospitalizacion.set(control.hospitalizacion_id, control);
      }
    }

    const enriched = hospitalizaciones.map((hospitalizacion) => ({
      ...hospitalizacion,
      ultimo_control: ultimoControlByHospitalizacion.get(hospitalizacion.id) ?? null,
    }));

    return {
      error: null,
      data: {
        hospitalizaciones: enriched,
        pacientes: pacientesRes.data ?? [],
        controlesHoy: controlesHoyRes.count ?? 0,
      },
    };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al cargar hospitalizaciones",
      data: null,
    };
  }
}

export async function createHospitalizacion(input: CreateHospitalizacionInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = createHospitalizacionSchema.parse(input);

    const [{ data: mascota }, { data: cliente }] = await Promise.all([
      supabase
        .from("mascotas")
        .select("id, cliente_id")
        .eq("id", validated.mascota_id)
        .eq("clinica_id", clinicaId)
        .maybeSingle(),
      supabase
        .from("clientes")
        .select("id")
        .eq("id", validated.cliente_id)
        .eq("clinica_id", clinicaId)
        .maybeSingle(),
    ]);

    if (!mascota) {
      return { error: "El paciente no pertenece a la clínica activa.", data: null };
    }
    if (!cliente) {
      return { error: "El responsable no pertenece a la clínica activa.", data: null };
    }
    if (mascota.cliente_id !== validated.cliente_id) {
      return { error: "El paciente no pertenece al responsable seleccionado.", data: null };
    }

    const { data: existente, error: existenteError } = await supabase
      .from("hospitalizaciones")
      .select("id")
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", validated.mascota_id)
      .eq("estado_text", "activa")
      .maybeSingle();

    if (existenteError) {
      return { error: "No se pudo validar si el paciente ya tiene una hospitalización activa.", data: null };
    }

    if (existente) {
      return { error: "Este paciente ya tiene una hospitalización activa.", data: existente };
    }

    const { data, error } = await supabase
      .from("hospitalizaciones")
      .insert({
        clinica_id: clinicaId,
        mascota_id: validated.mascota_id,
        cliente_id: validated.cliente_id,
        medico_tratante_text: cleanText(validated.medico_tratante_text),
        motivo_text: cleanText(validated.motivo_text),
        diagnostico_presuntivo_text: cleanText(validated.diagnostico_presuntivo_text),
        estado_text: "activa",
      })
      .select("id, mascota_id")
      .single();

    if (error) {
      logSupabaseError("[createHospitalizacion] insert error", error);
      return { error: error.message, data: null };
    }

    revalidateHospitalizacionPaths(data);
    return { error: null, data };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al crear internamiento",
      data: null,
    };
  }
}

export async function createHospitalizacionControl(input: CreateHospitalizacionControlInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = createHospitalizacionControlSchema.parse(input);

    const hospitalizacion = await getHospitalizacionActiva(
      supabase,
      clinicaId,
      validated.hospitalizacion_id,
    );

    if (!hospitalizacion) {
      return { error: "La hospitalización activa no pertenece a la clínica actual.", data: null };
    }
    if (hospitalizacion.mascota_id !== validated.mascota_id) {
      return { error: "El control no corresponde al paciente internado.", data: null };
    }

    const { data, error } = await supabase
      .from("hospitalizacion_controles")
      .insert({
        clinica_id: clinicaId,
        hospitalizacion_id: validated.hospitalizacion_id,
        mascota_id: validated.mascota_id,
        temperatura_num: validated.temperatura_num ?? null,
        frecuencia_cardiaca_num: validated.frecuencia_cardiaca_num ?? null,
        frecuencia_respiratoria_num: validated.frecuencia_respiratoria_num ?? null,
        peso_num: validated.peso_num ?? null,
        deshidratacion_pct: validated.deshidratacion_pct ?? null,
        mucosas_text: cleanText(validated.mucosas_text),
        tlc_text: cleanText(validated.tlc_text),
        comio_bool: validated.comio_bool ?? null,
        orino_bool: validated.orino_bool ?? null,
        defeco_bool: validated.defeco_bool ?? null,
        observaciones_text: cleanText(validated.observaciones_text),
      })
      .select("id, hospitalizacion_id, mascota_id")
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    revalidateHospitalizacionPaths(data);
    return { error: null, data };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al registrar control",
      data: null,
    };
  }
}

export async function createTratamientoHospitalizacion(input: CreateTratamientoHospitalizacionInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = createTratamientoHospitalizacionSchema.parse(input);

    const hospitalizacion = await getHospitalizacionActiva(
      supabase,
      clinicaId,
      validated.hospitalizacion_id,
    );

    if (!hospitalizacion) {
      return { error: "La hospitalizacion activa no pertenece a la clinica actual.", data: null };
    }
    if (hospitalizacion.mascota_id !== validated.mascota_id) {
      return { error: "El tratamiento no corresponde al paciente internado.", data: null };
    }

    const { data, error } = await supabase
      .from("hospitalizacion_tratamientos")
      .insert({
        clinica_id: clinicaId,
        hospitalizacion_id: validated.hospitalizacion_id,
        mascota_id: validated.mascota_id,
        nombre_text: validated.nombre_text,
        dosis_text: cleanText(validated.dosis_text),
        via_text: cleanText(validated.via_text),
        frecuencia_text: cleanText(validated.frecuencia_text),
        indicaciones_text: cleanText(validated.indicaciones_text),
        responsable_text: cleanText(validated.responsable_text),
        notas_text: cleanText(validated.notas_text),
        orden_num: validated.orden_num ?? null,
        estado_text: "activo",
      })
      .select("id, hospitalizacion_id, mascota_id")
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    revalidateHospitalizacionPaths(data);
    return { error: null, data };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al crear tratamiento",
      data: null,
    };
  }
}

export async function updateTratamientoHospitalizacion(input: UpdateTratamientoHospitalizacionInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = updateTratamientoHospitalizacionSchema.parse(input);

    const tratamiento = await getTratamientoHospitalizacion(supabase, clinicaId, validated.id);
    if (!tratamiento) {
      return { error: "Tratamiento no encontrado para la clinica actual.", data: null };
    }
    if (
      tratamiento.hospitalizacion_id !== validated.hospitalizacion_id ||
      tratamiento.mascota_id !== validated.mascota_id
    ) {
      return { error: "El tratamiento no coincide con la hospitalizacion seleccionada.", data: null };
    }
    if (tratamiento.estado_text !== "activo") {
      return { error: "Solo se pueden editar tratamientos activos.", data: null };
    }

    const hospitalizacion = await getHospitalizacionActiva(
      supabase,
      clinicaId,
      validated.hospitalizacion_id,
    );
    if (!hospitalizacion) {
      return { error: "La hospitalizacion activa no pertenece a la clinica actual.", data: null };
    }
    if (hospitalizacion.mascota_id !== validated.mascota_id) {
      return { error: "El tratamiento no corresponde al paciente internado.", data: null };
    }

    const { data, error } = await supabase
      .from("hospitalizacion_tratamientos")
      .update({
        nombre_text: validated.nombre_text,
        dosis_text: cleanText(validated.dosis_text),
        via_text: cleanText(validated.via_text),
        frecuencia_text: cleanText(validated.frecuencia_text),
        indicaciones_text: cleanText(validated.indicaciones_text),
        responsable_text: cleanText(validated.responsable_text),
        notas_text: cleanText(validated.notas_text),
        orden_num: validated.orden_num ?? null,
      })
      .eq("id", validated.id)
      .eq("clinica_id", clinicaId)
      .select("id, hospitalizacion_id, mascota_id")
      .maybeSingle();

    if (error) {
      return { error: error.message, data: null };
    }
    if (!data) {
      return { error: "No se pudo actualizar el tratamiento activo.", data: null };
    }

    revalidateHospitalizacionPaths(data);
    return { error: null, data };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al actualizar tratamiento",
      data: null,
    };
  }
}

async function cambiarEstadoTratamientoHospitalizacion(
  input: CambiarEstadoTratamientoHospitalizacionInput,
  estado: "terminado" | "suspendido",
) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();
  const validated = cambiarEstadoTratamientoHospitalizacionSchema.parse(input);

  const tratamiento = await getTratamientoHospitalizacion(supabase, clinicaId, validated.id);
  if (!tratamiento) {
    return { error: "Tratamiento no encontrado para la clinica actual.", data: null };
  }
  if (
    tratamiento.hospitalizacion_id !== validated.hospitalizacion_id ||
    tratamiento.mascota_id !== validated.mascota_id
  ) {
    return { error: "El tratamiento no coincide con la hospitalizacion seleccionada.", data: null };
  }
  if (tratamiento.estado_text === estado) {
    return { error: `El tratamiento ya esta ${estado}.`, data: null };
  }
  if (tratamiento.estado_text !== "activo") {
    return {
      error: `El tratamiento ya esta ${tratamiento.estado_text} y no puede cambiarse desde aqui.`,
      data: null,
    };
  }

  const hospitalizacion = await getHospitalizacionActiva(
    supabase,
    clinicaId,
    validated.hospitalizacion_id,
  );
  if (!hospitalizacion) {
    return { error: "La hospitalizacion activa no pertenece a la clinica actual.", data: null };
  }
  if (hospitalizacion.mascota_id !== validated.mascota_id) {
    return { error: "El tratamiento no corresponde al paciente internado.", data: null };
  }

  const { data, error } = await supabase
    .from("hospitalizacion_tratamientos")
    .update({
      estado_text: estado,
      terminado_at: new Date().toISOString(),
      notas_text: appendNotasTratamiento(tratamiento.notas_text, validated.notas_text),
    })
    .eq("id", validated.id)
    .eq("clinica_id", clinicaId)
    .eq("estado_text", "activo")
    .select("id, hospitalizacion_id, mascota_id")
    .maybeSingle();

  if (error) {
    return { error: error.message, data: null };
  }
  if (!data) {
    return { error: "No se pudo cambiar el estado del tratamiento activo.", data: null };
  }

  revalidateHospitalizacionPaths(data);
  return { error: null, data };
}

export async function terminarTratamientoHospitalizacion(
  input: CambiarEstadoTratamientoHospitalizacionInput,
) {
  try {
    return await cambiarEstadoTratamientoHospitalizacion(input, "terminado");
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al terminar tratamiento",
      data: null,
    };
  }
}

export async function suspenderTratamientoHospitalizacion(
  input: CambiarEstadoTratamientoHospitalizacionInput,
) {
  try {
    return await cambiarEstadoTratamientoHospitalizacion(input, "suspendido");
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al suspender tratamiento",
      data: null,
    };
  }
}

export async function darAltaHospitalizacion(input: AltaHospitalizacionInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validated = altaHospitalizacionSchema.parse(input);

    const hospitalizacion = await getHospitalizacionActiva(supabase, clinicaId, validated.id);
    if (!hospitalizacion) {
      return { error: "La hospitalización activa no pertenece a la clínica actual.", data: null };
    }

    const { data, error } = await supabase
      .from("hospitalizaciones")
      .update({
        estado_text: "alta",
        alta_at: new Date().toISOString(),
        alta_notas_text: cleanText(validated.alta_notas_text),
      })
      .eq("id", validated.id)
      .eq("clinica_id", clinicaId)
      .eq("estado_text", "activa")
      .select("id, mascota_id")
      .maybeSingle();

    if (error) {
      return { error: error.message, data: null };
    }
    if (!data) {
      return { error: "No se pudo dar alta a la hospitalización activa.", data: null };
    }

    revalidateHospitalizacionPaths(data);
    return { error: null, data };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al dar alta",
      data: null,
    };
  }
}

export async function getHospitalizacionById(id: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("hospitalizaciones")
      .select(`
        id,
        clinica_id,
        mascota_id,
        cliente_id,
        medico_tratante_text,
        motivo_text,
        diagnostico_presuntivo_text,
        estado_text,
        internado_at,
        alta_at,
        alta_notas_text,
        created_at,
        updated_at,
        mascotas:mascota_id (
          id,
          nombre,
          codigo_text,
          especie,
          raza,
          alertas_criticas,
          notas_manejo
        ),
        clientes:cliente_id (
          id,
          nombre,
          telefono
        ),
        hospitalizacion_controles (
          id,
          clinica_id,
          hospitalizacion_id,
          mascota_id,
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
          registrado_at,
          created_at
        )
      `)
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    if (error) {
      logSupabaseError("[getHospitalizacionById] hospitalizacion error", error);
      return { error: error.message, data: null };
    }

    if (!data) {
      return { error: "Hospitalización no encontrada.", data: null };
    }

    const queryTratamientos = () =>
      supabase
        .from("hospitalizacion_tratamientos")
        .select(`
          id,
          clinica_id,
          hospitalizacion_id,
          mascota_id,
          nombre_text,
          dosis_text,
          via_text,
          frecuencia_text,
          indicaciones_text,
          responsable_text,
          notas_text,
          orden_num,
          estado_text,
          iniciado_at,
          terminado_at,
          created_at,
          updated_at
        `)
        .eq("clinica_id", clinicaId)
        .eq("hospitalizacion_id", id);

    let tratamientosResult = await queryTratamientos();
    if (tratamientosResult.error && isTableOrSchemaError(tratamientosResult.error, "hospitalizacion_tratamientos")) {
      logSupabaseError("[getHospitalizacionById] tratamientos schema/cache error", tratamientosResult.error);
      const refreshResult = await refreshSchemaCache(supabase);
      if (refreshResult.error) {
        logSupabaseError("[getHospitalizacionById] refresh schema cache error", refreshResult.error);
      }
      if (refreshResult.refreshed) {
        tratamientosResult = await queryTratamientos();
      }
    }

    if (tratamientosResult.error) {
      logSupabaseError("[getHospitalizacionById] tratamientos error", tratamientosResult.error);
      if (isTableOrSchemaError(tratamientosResult.error, "hospitalizacion_tratamientos")) {
        (data as any).hospitalizacion_tratamientos = [];
        (data as any).tratamientosFeatureUnavailable = true;
        (data as any).tratamientosFeatureReason = buildTratamientosUnavailableMessage();
      } else {
        return { error: tratamientosResult.error.message, data: null };
      }
    }

    const estadoRank: Record<string, number> = {
      activo: 0,
      terminado: 1,
      suspendido: 1,
    };

    if (!(data as any).tratamientosFeatureUnavailable) {
      (data as any).hospitalizacion_tratamientos = (tratamientosResult.data ?? []).sort((a: any, b: any) => {
        const estadoDiff = (estadoRank[a.estado_text] ?? 9) - (estadoRank[b.estado_text] ?? 9);
        if (estadoDiff !== 0) return estadoDiff;

        const ordenA = a.orden_num ?? 9999;
        const ordenB = b.orden_num ?? 9999;
        if (ordenA !== ordenB) return ordenA - ordenB;

        return new Date(a.iniciado_at).getTime() - new Date(b.iniciado_at).getTime();
      });
    }

    // Sort controles by registrado_at desc
    if (data.hospitalizacion_controles) {
      data.hospitalizacion_controles.sort((a: any, b: any) => {
        return new Date(b.registrado_at).getTime() - new Date(a.registrado_at).getTime();
      });
    }

    return { error: null, data };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Error al obtener la hospitalización",
      data: null,
    };
  }
}
