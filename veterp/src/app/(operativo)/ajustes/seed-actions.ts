"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";

async function upsertById(supabase: any, table: string, rows: any[]) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Error en ${table}: ${error.message}`);
}

export async function seedFullDemoData() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    // --- RESET EXPLÍCITO ---
    // Eliminar datos raíz para que el borrado en cascada limpie toda la basura
    await supabase.from("clientes").delete().eq("clinica_id", clinicaId);
    await supabase.from("proveedores").delete().eq("clinica_id", clinicaId);
    await supabase.from("almacenes").delete().eq("clinica_id", clinicaId);
    await supabase.from("tipo_citas").delete().eq("clinica_id", clinicaId);
    await supabase.from("items_catalogo").delete().eq("clinica_id", clinicaId);
    // --- FIN RESET ---

    // IDs determinísticos
    const almacenId = "33333333-3333-4333-a333-333333333333";
    const proveedorId = "44444444-4444-4444-a444-444444444444";

    const itemConsultaId = "55555555-5555-4555-a555-555555555551";
    const itemVacunaId = "55555555-5555-4555-a555-555555555552";
    const itemDesparasitanteId = "55555555-5555-4555-a555-555555555553";

    // Almacenes y Proveedores
    const almacenesData = [
      { id: almacenId, clinica_id: clinicaId, nombre: "Almacen Principal", is_default: true }
    ];
    await upsertById(supabase, "almacenes", almacenesData);

    const proveedoresData = [
      { id: proveedorId, clinica_id: clinicaId, nombre: "Proveedor Demo", contacto: "Juan Perez", telefono: "555-1234" }
    ];
    await upsertById(supabase, "proveedores", proveedoresData);

    // Catálogo
    const catalogoData = [
      { id: itemConsultaId, clinica_id: clinicaId, nombre: "Consulta General", descripcion: "Consulta de rutina", kind: "servicio", precio_inc: 50, proveedor_id: null },
      { id: itemVacunaId, clinica_id: clinicaId, nombre: "Vacuna Antirrábica", descripcion: "Anual", kind: "producto", precio_inc: 25, proveedor_id: proveedorId },
      { id: itemDesparasitanteId, clinica_id: clinicaId, nombre: "Desparasitante", descripcion: "Pastilla", kind: "producto", precio_inc: 15, proveedor_id: proveedorId },
    ];
    await upsertById(supabase, "items_catalogo", catalogoData);

    // Movimientos de Stock
    const stockData = [
      { id: "88000000-0000-4000-a000-000000000001", clinica_id: clinicaId, item_id: itemVacunaId, almacen_id: almacenId, qty: 100, tipo: "entrada", notas: "Inventario inicial demo" },
      { id: "88000000-0000-4000-a000-000000000002", clinica_id: clinicaId, item_id: itemDesparasitanteId, almacen_id: almacenId, qty: 200, tipo: "entrada", notas: "Inventario inicial demo" }
    ];
    await upsertById(supabase, "movimientos_stock", stockData);

    // Clientes (5)
    // Clientes (5)
    const c1 = "aa000000-0000-4000-a000-000000000001";
    const c2 = "aa000000-0000-4000-a000-000000000002";
    const c3 = "aa000000-0000-4000-a000-000000000003";
    const c4 = "aa000000-0000-4000-a000-000000000004";
    const c5 = "aa000000-0000-4000-a000-000000000005";
    const clientesData = [
      { id: c1, clinica_id: clinicaId, nombre: "María García López", telefono: "555-0101", email: "maria.garcia@email.com" },
      { id: c2, clinica_id: clinicaId, nombre: "Carlos Rodríguez Pérez", telefono: "555-0202", email: "carlos.r@email.com" },
      { id: c3, clinica_id: clinicaId, nombre: "Ana Martínez Soto", telefono: "555-0303", email: null },
      { id: c4, clinica_id: clinicaId, nombre: "Jorge Hernández Cruz", telefono: "555-0404", email: "jorge.h@email.com" },
      { id: c5, clinica_id: clinicaId, nombre: "Laura Jiménez Ruiz", telefono: null, email: "laura.j@email.com" }
    ];
    await upsertById(supabase, "clientes", clientesData);

    // Mascotas (8)
    // Mascotas (8)
    const m1 = "bb000000-0000-4000-a000-000000000001";
    const m2 = "bb000000-0000-4000-a000-000000000002";
    const m3 = "bb000000-0000-4000-a000-000000000003";
    const m4 = "bb000000-0000-4000-a000-000000000004";
    const m5 = "bb000000-0000-4000-a000-000000000005";
    const m6 = "bb000000-0000-4000-a000-000000000006";
    const m7 = "bb000000-0000-4000-a000-000000000007";
    const m8 = "bb000000-0000-4000-a000-000000000008";
    const mascotasData = [
      { id: m1, clinica_id: clinicaId, cliente_id: c1, nombre: "Luna", especie: "Perro", raza: "Labrador Retriever", nacimiento: "2020-03-15" },
      { id: m2, clinica_id: clinicaId, cliente_id: c1, nombre: "Michi", especie: "Gato", raza: "Siamés", nacimiento: "2021-07-20" },
      { id: m3, clinica_id: clinicaId, cliente_id: c2, nombre: "Max", especie: "Perro", raza: "Pastor Alemán", nacimiento: "2019-11-05" },
      { id: m4, clinica_id: clinicaId, cliente_id: c3, nombre: "Canela", especie: "Perro", raza: "Beagle", nacimiento: "2022-01-10" },
      { id: m5, clinica_id: clinicaId, cliente_id: c3, nombre: "Mittens", especie: "Gato", raza: "Mestizo", nacimiento: "2020-09-30" },
      { id: m6, clinica_id: clinicaId, cliente_id: c4, nombre: "Rocky", especie: "Perro", raza: "Bulldog Francés", nacimiento: "2021-04-18" },
      { id: m7, clinica_id: clinicaId, cliente_id: c5, nombre: "Perla", especie: "Conejo", raza: "Enano Holandés", nacimiento: "2023-02-14" },
      { id: m8, clinica_id: clinicaId, cliente_id: c4, nombre: "Tobi", especie: "Perro", raza: "Golden Retriever", nacimiento: "2018-06-22" }
    ];
    await upsertById(supabase, "mascotas", mascotasData);

    // Tipos de cita (4)
    // Tipos de cita (4)
    const t1 = "cc000000-0000-4000-a000-000000000001";
    const t2 = "cc000000-0000-4000-a000-000000000002";
    const t3 = "cc000000-0000-4000-a000-000000000003";
    const t4 = "cc000000-0000-4000-a000-000000000004";
    const tiposCitaData = [
      { id: t1, clinica_id: clinicaId, nombre: "Consulta General", duracion_min: 30, color: "#3B82F6" },
      { id: t2, clinica_id: clinicaId, nombre: "Vacunación", duracion_min: 20, color: "#10B981" },
      { id: t3, clinica_id: clinicaId, nombre: "Cirugía", duracion_min: 120, color: "#EF4444" },
      { id: t4, clinica_id: clinicaId, nombre: "Control", duracion_min: 20, color: "#8B5CF6" }
    ];
    await upsertById(supabase, "tipo_citas", tiposCitaData);

    const now = new Date();
    const addHours = (date: Date, h: number) => new Date(date.getTime() + h * 60 * 60 * 1000).toISOString();
    const addDaysAndHours = (days: number, h: number) => new Date(now.getTime() + days * 86400000 + h * 3600000).toISOString();

    // Citas (6)
    // Citas (6)
    const citasData = [
      { id: "dd000000-0000-4000-a000-000000000001", clinica_id: clinicaId, cliente_id: c1, mascota_id: m1, tipo_cita_id: t1, estado: "programada", start_date: addHours(now, 1), end_date: addHours(now, 1.5) },
      { id: "dd000000-0000-4000-a000-000000000002", clinica_id: clinicaId, cliente_id: c2, mascota_id: m3, tipo_cita_id: t2, estado: "programada", start_date: addHours(now, 3), end_date: addHours(now, 3.3) },
      { id: "dd000000-0000-4000-a000-000000000003", clinica_id: clinicaId, cliente_id: c3, mascota_id: m4, tipo_cita_id: t1, estado: "confirmada", start_date: addHours(now, 7), end_date: addHours(now, 7.5) },
      { id: "dd000000-0000-4000-a000-000000000004", clinica_id: clinicaId, cliente_id: c4, mascota_id: m6, tipo_cita_id: t3, estado: "programada", start_date: addDaysAndHours(2, 2), end_date: addDaysAndHours(2, 4) },
      { id: "dd000000-0000-4000-a000-000000000005", clinica_id: clinicaId, cliente_id: c5, mascota_id: m7, tipo_cita_id: t4, estado: "programada", start_date: addDaysAndHours(3, 6), end_date: addDaysAndHours(3, 6.3) },
      { id: "dd000000-0000-4000-a000-000000000006", clinica_id: clinicaId, cliente_id: c1, mascota_id: m2, tipo_cita_id: t2, estado: "completada", start_date: addDaysAndHours(-5, 0), end_date: addDaysAndHours(-5, 0.3) }
    ];
    await upsertById(supabase, "citas", citasData);

    // Órdenes de Servicio (5)
    // Órdenes de Servicio (5)
    const ordenesData = [
      { id: "ee000000-0000-4000-a000-000000000001", clinica_id: clinicaId, cliente_id: c1, mascota_id: m1, estado_text: "open", started_at: new Date(Date.now() - 25*60000).toISOString() }, 
      { id: "ee000000-0000-4000-a000-000000000002", clinica_id: clinicaId, cliente_id: c2, mascota_id: m3, estado_text: "in_progress", started_at: new Date(Date.now() - 70*60000).toISOString() }, 
      { id: "ee000000-0000-4000-a000-000000000003", clinica_id: clinicaId, cliente_id: c3, mascota_id: m5, estado_text: "open", started_at: new Date(Date.now() - 5*60000).toISOString() }, 
      { id: "ee000000-0000-4000-a000-000000000004", clinica_id: clinicaId, cliente_id: c4, mascota_id: m6, estado_text: "finished", started_at: addDaysAndHours(-2, -1), finished_at: addDaysAndHours(-2, 0) },
      { id: "ee000000-0000-4000-a000-000000000005", clinica_id: clinicaId, cliente_id: c1, mascota_id: m2, estado_text: "closed", started_at: addDaysAndHours(-7, -1), finished_at: addDaysAndHours(-7, 0) } 
    ];
    await upsertById(supabase, "ordenes_servicio", ordenesData);

    // Ventas (2 cerradas)
    // Ventas (2 cerradas)
    const ventasData = [
      { id: "ff000000-0000-4000-a000-000000000001", clinica_id: clinicaId, orden_id: "ee000000-0000-4000-a000-000000000004", cliente_id: c4, total: 75, estado: "pagada" },
      { id: "ff000000-0000-4000-a000-000000000002", clinica_id: clinicaId, orden_id: "ee000000-0000-4000-a000-000000000005", cliente_id: c1, total: 65, estado: "pagada" }
    ];
    await upsertById(supabase, "ventas", ventasData);
    
    // Y un ledger asociado a esa venta
    const ledgerData = [
      { 
        id: "77000000-0000-4000-a000-000000000001", 
        clinica_id: clinicaId, 
        cliente_id: c4,
        venta_id: "ff000000-0000-4000-a000-000000000001", 
        orden_id: "ee000000-0000-4000-a000-000000000004",
        monto: 75, 
        tipo: "pago" 
      }
    ];
    await upsertById(supabase, "ledger", ledgerData);

    return {
      success: true,
      counts: {
        clientes: clientesData.length,
        mascotas: mascotasData.length,
        tiposCita: tiposCitaData.length,
        citas: citasData.length,
        ordenes: ordenesData.length,
        catalogo: catalogoData.length,
        stock: stockData.length,
        ventas: ventasData.length,
      }
    };
  } catch (error: any) {
    console.error("Error in seedFullDemoData:", error);
    return { success: false, error: error.message };
  }
}
