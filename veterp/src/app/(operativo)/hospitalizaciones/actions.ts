"use server";

import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import {
  altaHospitalizacionSchema,
  createHospitalizacionControlSchema,
  createHospitalizacionSchema,
  type AltaHospitalizacionInput,
  type CreateHospitalizacionControlInput,
  type CreateHospitalizacionInput,
} from "@/lib/validators/hospitalizaciones";

type HospitalizacionRow = {
  id: string;
  mascota_id: string;
  cliente_id: string;
  estado_text: string;
  internado_at: string;
  alta_at: string | null;
  alta_notas_text: string | null;
};

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateHospitalizacionPaths(row?: { mascota_id?: string | null } | null) {
  revalidatePath("/hospitalizaciones");
  if (row?.mascota_id) {
    revalidatePath(`/mascotas/${row.mascota_id}`);
  }
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
      return { error: hospitalizacionesRes.error.message, data: null };
    }
    if (pacientesRes.error) {
      return { error: pacientesRes.error.message, data: null };
    }
    if (controlesHoyRes.error) {
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

    const { data: existente } = await supabase
      .from("hospitalizaciones")
      .select("id")
      .eq("clinica_id", clinicaId)
      .eq("mascota_id", validated.mascota_id)
      .eq("estado_text", "activa")
      .maybeSingle();

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
