"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";

export async function getDashboardMetrics() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    // 1. Citas de Hoy
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startIso = startOfToday.toISOString();
    const endIso = endOfToday.toISOString();

    const { count: citasCount, error: citasError } = await supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .eq("clinica_id", clinicaId)
      .gte("start_date", startIso)
      .lte("start_date", endIso);

    if (citasError) {
      console.error("Error fetching citas:", citasError);
    }

    // 2. Ingresos del Día
    const { data: pagos, error: pagosError } = await supabase
      .from("ledger")
      .select("monto")
      .eq("clinica_id", clinicaId)
      .eq("tipo", "pago")
      .gte("fecha", startIso)
      .lte("fecha", endIso);

    let ingresosHoy = 0;
    if (pagosError) {
      console.error("Error fetching pagos:", pagosError);
    } else if (pagos) {
      ingresosHoy = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
    }

    // 3. Órdenes Abiertas (status != closed && status != finished)
    // Based on ESTADOS: open, in_progress, finished, closed.
    const { count: ordenesCount, error: ordenesError } = await supabase
      .from("ordenes_servicio")
      .select("*", { count: "exact", head: true })
      .eq("clinica_id", clinicaId)
      .in("estado_text", ["open", "in_progress"]);

    if (ordenesError) {
      console.error("Error fetching ordenes:", ordenesError);
    }

    return {
      error: null,
      data: {
        citasHoy: citasCount || 0,
        ingresosHoy,
        ordenesAbiertas: ordenesCount || 0,
      },
    };
  } catch (error: any) {
    console.error("Exception in getDashboardMetrics:", error);
    return { error: error.message || "Error al obtener métricas", data: null };
  }
}
