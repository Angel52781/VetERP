"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";

export async function getDashboardStats() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    // 1. Órdenes Activas
    const { count: ordenesCount, error: ordenesError } = await supabase
      .from("ordenes_servicio")
      .select("*", { count: "exact", head: true })
      .eq("clinica_id", clinicaId)
      .in("estado_text", ["open", "in_progress"]);

    if (ordenesError) throw ordenesError;

    // 2. Citas del día
    // Considerar hoy desde las 00:00:00 hasta las 23:59:59
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const { data: citas, error: citasError } = await supabase
      .from("citas")
      .select(`
        id,
        start_date,
        estado,
        clientes ( nombre ),
        mascotas ( nombre ),
        tipo_citas ( nombre, color )
      `)
      .eq("clinica_id", clinicaId)
      .gte("start_date", hoy.toISOString())
      .lt("start_date", manana.toISOString())
      .order("start_date", { ascending: true });

    if (citasError) throw citasError;

    // 3. Ventas y Cuentas por Cobrar
    // Obtener todas las ventas abiertas para las cuentas por cobrar
    const { data: ventasAbiertas, error: ventasAbiertasError } = await supabase
      .from("ventas")
      .select(`
        total,
        ledger ( monto, tipo )
      `)
      .eq("clinica_id", clinicaId)
      .neq("estado", "pagada");

    if (ventasAbiertasError) throw ventasAbiertasError;

    let cuentasPorCobrar = 0;
    for (const v of ventasAbiertas || []) {
      const pagado = v.ledger?.reduce((acc: number, l: any) => acc + Number(l.monto), 0) || 0;
      cuentasPorCobrar += Math.max(0, Number(v.total) - pagado);
    }

    // 4. Ventas del Día (Ingresos hoy)
    const { data: pagosHoy, error: pagosHoyError } = await supabase
      .from("ledger")
      .select("monto")
      .eq("clinica_id", clinicaId)
      .eq("tipo", "pago")
      .gte("fecha", hoy.toISOString())
      .lt("fecha", manana.toISOString());

    if (pagosHoyError) throw pagosHoyError;

    const ingresosHoy = pagosHoy?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0;

    return {
      error: null,
      data: {
        ordenesActivas: ordenesCount || 0,
        citasHoy: citas || [],
        ingresosHoy,
        cuentasPorCobrar
      }
    };
  } catch (error: any) {
    console.error("Exception in getDashboardStats:", error);
    return { error: error.message || "Error al obtener las estadísticas del dashboard", data: null };
  }
}
