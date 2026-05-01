"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { tipoCitaSchema, citaSchema, TipoCitaInput, CitaInput } from "@/lib/validators/agenda";

const ESTADOS_CITA = ["programada", "confirmada", "llego", "en_atencion", "cancelada", "no_asistio", "completada"] as const;
type EstadoCita = (typeof ESTADOS_CITA)[number];

function canTransitionEstadoCita(actual: EstadoCita | null, siguiente: EstadoCita) {
  if (!actual || actual === siguiente) return true;

  const allowed: Record<EstadoCita, EstadoCita[]> = {
    programada: ["confirmada", "llego", "cancelada", "no_asistio"],
    confirmada: ["llego", "cancelada", "no_asistio"],
    llego: ["en_atencion", "cancelada"],
    en_atencion: ["completada"],
    cancelada: [],
    no_asistio: [],
    completada: [],
  };

  return allowed[actual].includes(siguiente);
}

async function validateCitaRelations(
  supabase: any,
  clinicaId: string,
  clienteId: string,
  mascotaId: string,
  tipoCitaId: string,
) {
  const [{ data: cliente }, { data: mascota }, { data: tipoCita }] = await Promise.all([
    supabase.from("clientes").select("id").eq("id", clienteId).eq("clinica_id", clinicaId).maybeSingle(),
    supabase
      .from("mascotas")
      .select("id, cliente_id")
      .eq("id", mascotaId)
      .eq("clinica_id", clinicaId)
      .maybeSingle(),
    supabase.from("tipo_citas").select("id").eq("id", tipoCitaId).eq("clinica_id", clinicaId).maybeSingle(),
  ]);

  if (!cliente) return "El cliente no pertenece a la clínica activa.";
  if (!mascota) return "La mascota no pertenece a la clínica activa.";
  if (!tipoCita) return "El tipo de cita no pertenece a la clínica activa.";
  if (mascota.cliente_id !== clienteId) return "La mascota no pertenece al cliente seleccionado.";

  return null;
}

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
    const relationError = await validateCitaRelations(
      supabase,
      clinicaId,
      validatedData.cliente_id,
      validatedData.mascota_id,
      validatedData.tipo_cita_id,
    );
    if (relationError) {
      return { error: relationError, data: null };
    }

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
        id,
        start_date,
        end_date,
        estado,
        tipo_cita_id,
        cliente_id,
        mascota_id,
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

    const citas = data ?? [];
    const mascotaIds = Array.from(new Set(citas.map((c: any) => c.mascota_id).filter(Boolean)));

    if (mascotaIds.length === 0) {
      return { error: null, data: citas };
    }

    const { data: ordenesActivas, error: ordenesError } = await supabase
      .from("ordenes_servicio")
      .select("id, mascota_id, estado_text, started_at")
      .eq("clinica_id", clinicaId)
      .in("estado_text", ["open", "in_progress"])
      .in("mascota_id", mascotaIds);

    if (ordenesError) {
      console.error("Error fetching active ordenes for citas:", ordenesError);
      return { error: ordenesError.message, data: null };
    }

    const ordenByMascota = new Map<string, any>();
    for (const orden of ordenesActivas ?? []) {
      const current = ordenByMascota.get(orden.mascota_id);
      if (!current) {
        ordenByMascota.set(orden.mascota_id, orden);
        continue;
      }

      if (current.estado_text !== "in_progress" && orden.estado_text === "in_progress") {
        ordenByMascota.set(orden.mascota_id, orden);
        continue;
      }

      const currentStarted = current.started_at ? new Date(current.started_at).getTime() : 0;
      const nextStarted = orden.started_at ? new Date(orden.started_at).getTime() : 0;
      if (nextStarted > currentStarted) {
        ordenByMascota.set(orden.mascota_id, orden);
      }
    }

    const enrichedCitas = citas.map((cita: any) => {
      const ordenActiva = ordenByMascota.get(cita.mascota_id);
      return {
        ...cita,
        active_order_id: ordenActiva?.id ?? null,
        active_order_estado_text: ordenActiva?.estado_text ?? null,
      };
    });

    return { error: null, data: enrichedCitas };
  } catch (err: any) {
    return { error: err.message || "Error al obtener citas", data: null };
  }
}

export async function updateCitaEstado(citaId: string, nextEstado: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    if (!ESTADOS_CITA.includes(nextEstado as EstadoCita)) {
      return { error: "Estado de cita no soportado", data: null };
    }

    const { data: cita, error: citaError } = await supabase
      .from("citas")
      .select("id, estado, start_date")
      .eq("id", citaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (citaError || !cita) {
      return { error: "No se encontró la cita", data: null };
    }

    const actual = (cita.estado ?? "programada") as EstadoCita;
    const siguiente = nextEstado as EstadoCita;
    const inicio = new Date(cita.start_date);
    const msToStart = Number.isNaN(inicio.getTime()) ? -1 : inicio.getTime() - Date.now();
    const isFuture = msToStart > 0;
    const isFutureFar = msToStart > 120 * 60 * 1000;
    const isFutureWithinEarlyWindow = isFuture && !isFutureFar;

    if (isFutureFar && actual !== siguiente && !["confirmada", "cancelada"].includes(siguiente)) {
      return { error: "Para citas fuera de la ventana anticipada solo se permite confirmar o cancelar.", data: null };
    }

    if (isFutureWithinEarlyWindow && ["no_asistio", "completada"].includes(siguiente)) {
      return { error: "No se puede marcar 'no asistió' o 'completada' antes de la hora de inicio.", data: null };
    }

    if (!canTransitionEstadoCita(actual, siguiente)) {
      return { error: `No se puede pasar de '${actual}' a '${siguiente}'`, data: null };
    }

    const { data, error } = await supabase
      .from("citas")
      .update({ estado: siguiente })
      .eq("id", citaId)
      .eq("clinica_id", clinicaId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar estado de cita", data: null };
  }
}

export async function updateCita(citaId: string, input: CitaInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validatedData = citaSchema.parse(input);
    const relationError = await validateCitaRelations(
      supabase,
      clinicaId,
      validatedData.cliente_id,
      validatedData.mascota_id,
      validatedData.tipo_cita_id,
    );
    if (relationError) {
      return { error: relationError, data: null };
    }

    const { data: cita, error: citaError } = await supabase
      .from("citas")
      .select("id, estado")
      .eq("id", citaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (citaError || !cita) {
      return { error: "No se encontró la cita", data: null };
    }

    const estadoActual = (cita.estado ?? "programada") as string;
    if (!["programada", "confirmada"].includes(estadoActual)) {
      return { error: "Solo se pueden reprogramar citas programadas o confirmadas.", data: null };
    }

    const startDate = new Date(validatedData.start_date).toISOString();
    const endDate = new Date(validatedData.end_date).toISOString();

    const { data, error } = await supabase
      .from("citas")
      .update({
        cliente_id: validatedData.cliente_id,
        mascota_id: validatedData.mascota_id,
        tipo_cita_id: validatedData.tipo_cita_id,
        start_date: startDate,
        end_date: endDate,
      })
      .eq("id", citaId)
      .eq("clinica_id", clinicaId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al reprogramar cita", data: null };
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
