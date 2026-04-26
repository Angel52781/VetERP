"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";

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
          id, created_at, tipo_text, texto_text,
          motivo_consulta_text, peso_kg_num, temperatura_c_num,
          frecuencia_cardiaca_num, frecuencia_respiratoria_num,
          observaciones_text, diagnostico_text
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

  return { 
    mascota: mascotaRes.data, 
    ordenes: ordenesRes.data,
    citas: citasRes.data,
    error: mascotaRes.error?.message || ordenesRes.error?.message || citasRes.error?.message 
  };
}
