"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies, requireUserRole } from "@/lib/clinica";
import { itemVentaSchema, ItemVentaInput, ledgerSchema, LedgerInput } from "@/lib/validators/ventas";
import { revalidatePath } from "next/cache";

export async function getVentaByOrden(ordenId: string) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const { data: venta, error } = await supabase
    .from("ventas")
    .select(`
      *,
      items_venta (
        id,
        cantidad,
        precio_unitario,
        total_linea,
        items_catalogo (
          id,
          nombre,
          kind
        )
      ),
      ledger (
        id,
        tipo,
        monto,
        fecha
      )
    `)
    .eq("clinica_id", clinicaId)
    .eq("orden_id", ordenId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching venta:", error);
    return { error: error.message, data: null };
  }

  return { error: null, data: venta };
}

export async function getOrCreateVenta(ordenId: string, clienteId: string) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  // Try to find existing
  let { data: venta, error } = await supabase
    .from("ventas")
    .select(`
      *,
      items_venta (
        id,
        cantidad,
        precio_unitario,
        total_linea,
        items_catalogo (
          id,
          nombre,
          kind
        )
      ),
      ledger (
        id,
        tipo,
        monto,
        fecha
      )
    `)
    .eq("clinica_id", clinicaId)
    .eq("orden_id", ordenId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching venta:", error);
    return { error: error.message, data: null };
  }

  if (!venta) {
    // Create new
    const { data: newVenta, error: insertError } = await supabase
      .from("ventas")
      .insert({
        clinica_id: clinicaId,
        cliente_id: clienteId,
        orden_id: ordenId,
        estado: "abierta",
        total: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating venta:", insertError);
      return { error: insertError.message, data: null };
    }
    venta = { ...newVenta, items_venta: [], ledger: [] };
  }

  return { error: null, data: venta };
}

export async function getItemsCatalogo() {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items_catalogo")
    .select("*")
    .eq("clinica_id", clinicaId)
    .eq("is_disabled", false)
    .order("nombre");

  if (error) {
    console.error("Error fetching items catalogo:", error);
    return { error: error.message, data: [] };
  }

  return { error: null, data };
}

async function getDefaultAlmacen(clinicaId: string, supabase: any) {
  let { data: almacen } = await supabase
    .from("almacenes")
    .select("id")
    .eq("clinica_id", clinicaId)
    .eq("is_default", true)
    .single();

  if (!almacen) {
    const { data: firstAlmacen } = await supabase
      .from("almacenes")
      .select("id")
      .eq("clinica_id", clinicaId)
      .limit(1)
      .single();
    
    almacen = firstAlmacen;
  }

  if (!almacen) {
    const { data: newAlmacen } = await supabase
      .from("almacenes")
      .insert({
        clinica_id: clinicaId,
        nombre: "Almacén Principal",
        is_default: true,
      })
      .select("id")
      .single();
    almacen = newAlmacen;
  }

  return almacen.id;
}

export async function addItemToVenta(ventaId: string, input: Omit<ItemVentaInput, "venta_id">) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    // Validar input
    const validatedData = itemVentaSchema.parse({
      ...input,
      venta_id: ventaId,
    });

    // 1. Obtener precio actual del item desde el catálogo (seguridad backend)
    const { data: itemCatalogo, error: itemError } = await supabase
      .from("items_catalogo")
      .select("precio_inc, kind")
      .eq("id", validatedData.item_id)
      .eq("clinica_id", clinicaId)
      .single();

    if (itemError || !itemCatalogo) {
      return { error: "Item no encontrado", data: null };
    }

    const precioUnitario = itemCatalogo.precio_inc;
    const totalLinea = precioUnitario * validatedData.cantidad;

    // 2. Insertar item_venta
    const { data: newItem, error: insertError } = await supabase
      .from("items_venta")
      .insert({
        clinica_id: clinicaId,
        venta_id: ventaId,
        item_id: validatedData.item_id,
        cantidad: validatedData.cantidad,
        precio_unitario: precioUnitario,
        total_linea: totalLinea,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting item_venta:", insertError);
      return { error: insertError.message, data: null };
    }

    if (itemCatalogo.kind === "producto") {
      const almacenId = await getDefaultAlmacen(clinicaId, supabase);
      const { error: stockError } = await supabase
        .from("movimientos_stock")
        .insert({
          clinica_id: clinicaId,
          item_id: validatedData.item_id,
          almacen_id: almacenId,
          qty: -validatedData.cantidad,
          tipo: "venta",
          notas: `Venta ${ventaId}`,
        });

      if (stockError) {
        console.error("Error reducing stock:", stockError);
        // We might want to rollback the item_venta insertion here if this was a true transaction,
        // but for now we log it.
      }
    }

    // 3. Recalcular total de la venta de forma segura
    await recalcularTotalVenta(ventaId, clinicaId, supabase);

    revalidatePath("/(operativo)/orden_y_colas/[id]", "page");
    return { error: null, data: newItem };
  } catch (error: any) {
    console.error("Exception in addItemToVenta:", error);
    return { error: error.message || "Error al agregar ítem a la venta", data: null };
  }
}

async function recalcularTotalVenta(ventaId: string, clinicaId: string, supabase: any) {
  // Sumar todos los items
  const { data: items, error: itemsError } = await supabase
    .from("items_venta")
    .select("total_linea")
    .eq("venta_id", ventaId)
    .eq("clinica_id", clinicaId);

  if (itemsError) {
    console.error("Error fetching items to recalculate total:", itemsError);
    return;
  }

  const total = items.reduce((acc: number, item: any) => acc + Number(item.total_linea), 0);

  // Actualizar la venta
  await supabase
    .from("ventas")
    .update({ total })
    .eq("id", ventaId)
    .eq("clinica_id", clinicaId);
}

export async function removeVentaItem(itemId: string, ventaId: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    // 1. Obtener item_venta para revertir stock
    const { data: itemVenta, error: fetchError } = await supabase
      .from("items_venta")
      .select(`
        cantidad,
        item_id,
        items_catalogo!inner (
          kind
        )
      `)
      .eq("id", itemId)
      .eq("venta_id", ventaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (fetchError) {
      console.error("Error fetching item_venta to remove:", fetchError);
      return { error: fetchError.message };
    }

    const { error } = await supabase
      .from("items_venta")
      .delete()
      .eq("id", itemId)
      .eq("venta_id", ventaId)
      .eq("clinica_id", clinicaId);

    if (error) {
      console.error("Error removing item_venta:", error);
      return { error: error.message };
    }

    const kind = Array.isArray(itemVenta.items_catalogo) 
      ? itemVenta.items_catalogo[0]?.kind 
      : (itemVenta.items_catalogo as any)?.kind;

    if (kind === "producto") {
      const almacenId = await getDefaultAlmacen(clinicaId, supabase);
      const { error: stockError } = await supabase
        .from("movimientos_stock")
        .insert({
          clinica_id: clinicaId,
          item_id: itemVenta.item_id,
          almacen_id: almacenId,
          qty: itemVenta.cantidad,
          tipo: "reversion_venta",
          notas: `Reversión Venta ${ventaId}`,
        });

      if (stockError) {
        console.error("Error reverting stock:", stockError);
      }
    }

    await recalcularTotalVenta(ventaId, clinicaId, supabase);
    revalidatePath("/(operativo)/orden_y_colas/[id]", "page");
    return { error: null };
  } catch (error: any) {
    console.error("Exception in removeVentaItem:", error);
    return { error: error.message || "Error al remover ítem" };
  }
}

export async function registrarPago(ventaId: string, input: LedgerInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const validatedData = ledgerSchema.parse({
      ...input,
      venta_id: ventaId,
      tipo: "pago", // Forzar tipo pago
    });

    const { data: newPago, error: insertError } = await supabase
      .from("ledger")
      .insert({
        clinica_id: clinicaId,
        cliente_id: validatedData.cliente_id,
        venta_id: ventaId,
        orden_id: validatedData.orden_id,
        tipo: "pago",
        monto: validatedData.monto,
        fecha: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting ledger pago:", insertError);
      return { error: insertError.message, data: null };
    }

    // Verificar si la venta ya está pagada por completo
    const { data: venta } = await supabase
      .from("ventas")
      .select("total")
      .eq("id", ventaId)
      .eq("clinica_id", clinicaId)
      .single();

    const { data: pagos } = await supabase
      .from("ledger")
      .select("monto")
      .eq("venta_id", ventaId)
      .eq("tipo", "pago")
      .eq("clinica_id", clinicaId);

    if (venta && pagos) {
      const totalPagado = pagos.reduce((acc: number, p: any) => acc + Number(p.monto), 0);
      if (totalPagado >= Number(venta.total)) {
        await supabase
          .from("ventas")
          .update({ estado: "pagada" })
          .eq("id", ventaId)
          .eq("clinica_id", clinicaId);
      }
    }

    revalidatePath("/(operativo)/orden_y_colas/[id]", "page");
    revalidatePath("/(operativo)/caja_inventario", "page");
    return { error: null, data: newPago };
  } catch (error: any) {
    console.error("Exception in registrarPago:", error);
    return { error: error.message || "Error al registrar pago", data: null };
  }
}

export async function getVentasResumen() {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select(`
      *,
      clientes:cliente_id (
        nombre
      ),
      ledger (
        monto,
        tipo
      )
    `)
    .eq("clinica_id", clinicaId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ventas resumen:", error);
    return { error: error.message, data: [] };
  }

  return { error: null, data: ventas };
}

export async function getInventario() {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  // First get all items of kind = 'producto'
  const { data: productos, error: itemsError } = await supabase
    .from("items_catalogo")
    .select("id, nombre, is_disabled")
    .eq("clinica_id", clinicaId)
    .eq("kind", "producto")
    .order("nombre");

  if (itemsError) {
    console.error("Error fetching productos:", itemsError);
    return { error: itemsError.message, data: [] };
  }

  // Get stock sums grouped by item_id
  // Because supabase doesn't support GROUP BY directly in select yet without RPC,
  // we'll fetch all movimientos for this clinic and group them in JS (fine for small to medium scale)
  // Or we can just use an RPC. Since we don't want to create an RPC now, we can fetch them.
  // Actually, we can just fetch the sum using postgREST if possible, but let's just fetch all.
  
  const { data: movimientos, error: movsError } = await supabase
    .from("movimientos_stock")
    .select("item_id, qty")
    .eq("clinica_id", clinicaId);

  if (movsError) {
    console.error("Error fetching movimientos_stock:", movsError);
    return { error: movsError.message, data: [] };
  }

  // Group by item_id
  const stockMap: Record<string, number> = {};
  for (const mov of movimientos || []) {
    if (!stockMap[mov.item_id]) {
      stockMap[mov.item_id] = 0;
    }
    stockMap[mov.item_id] += Number(mov.qty);
  }

  const result = (productos || []).map(p => ({
    ...p,
    stock: stockMap[p.id] || 0
  }));

  return { error: null, data: result };
}

import { movimientoStockSchema, MovimientoStockInput } from "@/lib/validators/ajustes";

export async function addMovimientoStock(input: MovimientoStockInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const validatedData = movimientoStockSchema.parse(input);

    const { data, error } = await supabase
      .from("movimientos_stock")
      .insert({
        ...validatedData,
        clinica_id: clinicaId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating movimiento_stock:", error);
      return { error: error.message, data: null };
    }

    revalidatePath("/(operativo)/caja_inventario", "page");
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Error al registrar movimiento", data: null };
  }
}
