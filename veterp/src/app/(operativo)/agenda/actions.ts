"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import {
  citaSchema,
  tipoCitaDisabledSchema,
  tipoCitaSchema,
  tipoCitaUpdateSchema,
  type CitaInput,
  type TipoCitaDisabledInput,
  type TipoCitaInput,
  type TipoCitaUpdateInput,
} from "@/lib/validators/agenda";

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
  options: { allowDisabledTipoCitaId?: string | null } = {},
) {
  const [{ data: cliente }, { data: mascota }, { data: tipoCita }] = await Promise.all([
    supabase.from("clientes").select("id").eq("id", clienteId).eq("clinica_id", clinicaId).maybeSingle(),
    supabase
      .from("mascotas")
      .select("id, cliente_id")
      .eq("id", mascotaId)
      .eq("clinica_id", clinicaId)
      .maybeSingle(),
    supabase
      .from("tipo_citas")
      .select("id, is_disabled")
      .eq("id", tipoCitaId)
      .eq("clinica_id", clinicaId)
      .maybeSingle(),
  ]);

  if (!cliente) return "El cliente no pertenece a la clinica activa.";
  if (!mascota) return "La mascota no pertenece a la clinica activa.";
  if (!tipoCita) return "El tipo de cita no pertenece a la clinica activa.";
  if (tipoCita.is_disabled && tipoCita.id !== options.allowDisabledTipoCitaId) {
    return "El tipo de cita esta inactivo para nuevas programaciones.";
  }
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
        nombre: validatedData.nombre,
        duracion_min: validatedData.duracion_min,
        color: validatedData.color || null,
        area: validatedData.area,
        is_disabled: false,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tipo cita:", error);
      return { error: error.message, data: null };
    }

    revalidatePath("/agenda");
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al crear tipo de cita", data: null };
  }
}

export async function updateTipoCita(id: string, input: TipoCitaUpdateInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const validatedData = tipoCitaUpdateSchema.parse(input);

    const { data, error } = await supabase
      .from("tipo_citas")
      .update({
        nombre: validatedData.nombre,
        duracion_min: validatedData.duracion_min,
        color: validatedData.color || null,
        area: validatedData.area,
      })
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating tipo cita:", error);
      return { error: error.message, data: null };
    }

    if (!data) {
      return { error: "No se encontro el tipo de cita.", data: null };
    }

    revalidatePath("/agenda");
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al actualizar tipo de cita", data: null };
  }
}

export async function setTipoCitaDisabled(id: string, input: TipoCitaDisabledInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const { disabled } = tipoCitaDisabledSchema.parse(input);

    const { data, error } = await supabase
      .from("tipo_citas")
      .update({ is_disabled: disabled })
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error toggling tipo cita:", error);
      return { error: error.message, data: null };
    }

    if (!data) {
      return { error: "No se encontro el tipo de cita.", data: null };
    }

    revalidatePath("/agenda");
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al cambiar estado del tipo de cita", data: null };
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
        notas_text: validatedData.notas_text?.trim() || null,
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
      .eq("is_disabled", false)
      .order("area")
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

export async function getTiposCitaForManagement() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tipo_citas")
      .select("*")
      .eq("clinica_id", clinicaId)
      .order("area")
      .order("nombre");

    if (error) {
      console.error("Error fetching tipos cita for management:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al obtener configuracion de tipos de cita", data: null };
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
        notas_text,
        tipo_cita_id,
        cliente_id,
        mascota_id,
        clientes ( nombre ),
        mascotas ( nombre, codigo_text ),
        tipo_citas ( nombre, color, area, is_disabled )
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
      .select("id, estado, start_date, mascota_id")
      .eq("id", citaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (citaError || !cita) {
      return { error: "No se encontro la cita", data: null };
    }

    const actual = (cita.estado ?? "programada") as EstadoCita;
    const siguiente = nextEstado as EstadoCita;
    const inicio = new Date(cita.start_date);
    const msToStart = Number.isNaN(inicio.getTime()) ? -1 : inicio.getTime() - Date.now();
    const isFuture = msToStart > 0;
    const isFutureFar = msToStart > 120 * 60 * 1000;
    const isFutureWithinEarlyWindow = isFuture && !isFutureFar;

    if (actual === "cancelada" && ["en_atencion", "completada"].includes(siguiente)) {
      return { error: "No se puede iniciar atención de una cita cancelada.", data: null };
    }

    if (actual === "no_asistio" && ["en_atencion", "completada"].includes(siguiente)) {
      return { error: "No se puede modificar una cita marcada como no asistió sin reprogramarla.", data: null };
    }

    if (isFutureFar && actual !== siguiente && !["confirmada", "cancelada"].includes(siguiente)) {
      return { error: "Para citas fuera de la ventana anticipada solo se permite confirmar o cancelar.", data: null };
    }

    if (isFutureWithinEarlyWindow && ["no_asistio", "completada"].includes(siguiente)) {
      return { error: "No se puede marcar 'no asistio' o 'completada' antes de la hora de inicio.", data: null };
    }

    if (!canTransitionEstadoCita(actual, siguiente)) {
      return { error: `No se puede pasar de '${actual}' a '${siguiente}'`, data: null };
    }

    if (siguiente === "completada" && cita.mascota_id) {
      const start = new Date(cita.start_date);
      if (!Number.isNaN(start.getTime())) {
        const dayStart = new Date(start);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(start);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: ordenActiva, error: ordenError } = await supabase
          .from("ordenes_servicio")
          .select("id")
          .eq("clinica_id", clinicaId)
          .eq("mascota_id", cita.mascota_id)
          .in("estado_text", ["open", "in_progress"])
          .gte("started_at", dayStart.toISOString())
          .lte("started_at", dayEnd.toISOString())
          .limit(1)
          .maybeSingle();

        if (ordenError) {
          return { error: "No se pudo validar el estado operativo de la orden asociada.", data: null };
        }

        if (ordenActiva?.id) {
          return { error: "No se puede completar una cita con una orden activa.", data: null };
        }
      }
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

    const { data: cita, error: citaError } = await supabase
      .from("citas")
      .select("id, estado, tipo_cita_id")
      .eq("id", citaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (citaError || !cita) {
      return { error: "No se encontro la cita", data: null };
    }

    const estadoActual = (cita.estado ?? "programada") as string;
    if (!["programada", "confirmada"].includes(estadoActual)) {
      return { error: "Solo se pueden reprogramar citas programadas o confirmadas.", data: null };
    }

    const relationError = await validateCitaRelations(
      supabase,
      clinicaId,
      validatedData.cliente_id,
      validatedData.mascota_id,
      validatedData.tipo_cita_id,
      { allowDisabledTipoCitaId: cita.tipo_cita_id },
    );
    if (relationError) {
      return { error: relationError, data: null };
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
        notas_text: validatedData.notas_text?.trim() || null,
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
      .select(`
        id,
        nombre,
        telefono,
        email,
        mascotas (
          id,
          nombre,
          codigo_text
        )
      `)
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
      .select("id, nombre, codigo_text")
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
