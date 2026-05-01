"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies, requireUserRole } from "@/lib/clinica";
import { 
  itemVentaSchema, 
  ItemVentaInput, 
  ledgerSchema, 
  LedgerInput,
  abrirCajaSchema,
  AbrirCajaInput,
  cerrarCajaSchema,
  CerrarCajaInput
} from "@/lib/validators/ventas";
import { revalidatePath } from "next/cache";
import { formatMoneyPEN } from "@/lib/money";

async function ensureClienteInClinica(supabase: any, clinicaId: string, clienteId: string) {
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();
  return cliente;
}

async function ensureOrdenInClinica(supabase: any, clinicaId: string, ordenId: string) {
  const { data: orden } = await supabase
    .from("ordenes_servicio")
    .select("id, cliente_id")
    .eq("id", ordenId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();
  return orden;
}

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

export async function getVentasDeOrden(ordenId: string) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const { data: ventas, error } = await supabase
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
        fecha,
        metodo_pago
      )
    `)
    .eq("clinica_id", clinicaId)
    .eq("orden_id", ordenId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching ventas de orden:", error);
    return { error: error.message, data: [] };
  }

  return { error: null, data: ventas || [] };
}

export async function crearVenta(ordenId: string, clienteId: string) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const [orden, cliente] = await Promise.all([
    ensureOrdenInClinica(supabase, clinicaId, ordenId),
    ensureClienteInClinica(supabase, clinicaId, clienteId),
  ]);
  if (!orden) {
    return { error: "La orden no pertenece a la clínica activa.", data: null };
  }
  if (!cliente) {
    return { error: "El cliente no pertenece a la clínica activa.", data: null };
  }
  if (orden.cliente_id !== clienteId) {
    return { error: "La orden no corresponde al cliente seleccionado.", data: null };
  }

  const { data: existingOpenVenta, error: existingOpenError } = await supabase
    .from("ventas")
    .select("id, estado, orden_id")
    .eq("clinica_id", clinicaId)
    .eq("orden_id", ordenId)
    .eq("estado", "abierta")
    .maybeSingle();

  if (existingOpenError) {
    console.error("Error checking existing open venta:", existingOpenError);
    return { error: existingOpenError.message, data: null };
  }

  if (existingOpenVenta) {
    return { error: null, data: existingOpenVenta, reused: true };
  }

  const { data: newVenta, error: insertError } = await supabase
    .from("ventas")
    .insert({
      clinica_id: clinicaId,
      cliente_id: clienteId,
      orden_id: ordenId,
      estado: "abierta",
      total: 0,
    })
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
        fecha,
        metodo_pago
      )
    `)
    .single();

  if (insertError) {
    console.error("Error creating venta:", insertError);
    return { error: insertError.message, data: null };
  }

  return { error: null, data: newVenta };
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

    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .select("id, estado")
      .eq("id", ventaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (ventaError || !venta) {
      return { error: "No se encontró la venta activa", data: null };
    }

    if (venta.estado === "pagada") {
      return { error: "No se pueden agregar ítems a una venta pagada", data: null };
    }

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
    const totalLineaAdicional = precioUnitario * validatedData.cantidad;

    let almacenId = null;

    // 2. Verificar stock ANTES de insertar nada si es producto
    if (itemCatalogo.kind === "producto") {
      almacenId = await getDefaultAlmacen(clinicaId, supabase);
      
      const { data: movs } = await supabase
        .from("movimientos_stock")
        .select("qty")
        .eq("clinica_id", clinicaId)
        .eq("item_id", validatedData.item_id);
      
      const currentStock = (movs || []).reduce((acc: number, mov: any) => acc + Number(mov.qty), 0);
      
      if (currentStock < validatedData.cantidad) {
        return { error: "Stock insuficiente para realizar la venta", data: null };
      }
    }

    // 3. Buscar si el ítem ya existe en la venta actual
    const { data: existingItem } = await supabase
      .from("items_venta")
      .select("id, cantidad, total_linea")
      .eq("venta_id", ventaId)
      .eq("item_id", validatedData.item_id)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    let newItem;

    if (existingItem) {
      // 3a. Agrupar (aumentar cantidad)
      const newCantidad = Number(existingItem.cantidad) + validatedData.cantidad;
      const newTotalLinea = Number(existingItem.total_linea) + totalLineaAdicional;

      const { data: updatedItem, error: updateError } = await supabase
        .from("items_venta")
        .update({
          cantidad: newCantidad,
          total_linea: newTotalLinea,
        })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating item_venta:", updateError);
        return { error: updateError.message, data: null };
      }
      newItem = updatedItem;
    } else {
      // 3b. Insertar nueva fila
      const { data: insertedItem, error: insertError } = await supabase
        .from("items_venta")
        .insert({
          clinica_id: clinicaId,
          venta_id: ventaId,
          item_id: validatedData.item_id,
          cantidad: validatedData.cantidad,
          precio_unitario: precioUnitario,
          total_linea: totalLineaAdicional,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting item_venta:", insertError);
        return { error: insertError.message, data: null };
      }
      newItem = insertedItem;
    }

    // 4. Si es producto, registrar el movimiento de salida (solo por la cantidad nueva)
    if (itemCatalogo.kind === "producto" && almacenId) {
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

    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .select("id, estado")
      .eq("id", ventaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (ventaError || !venta) {
      return { error: "No se encontró la venta activa" };
    }

    if (venta.estado === "pagada") {
      return { error: "No se pueden remover ítems de una venta pagada" };
    }

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

    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .select("id, total, estado, cliente_id, orden_id")
      .eq("id", ventaId)
      .eq("clinica_id", clinicaId)
      .single();

    if (ventaError || !venta) {
      return { error: "No se encontró la venta para registrar el pago", data: null };
    }

    if (venta.estado === "pagada") {
      return { error: "La venta ya está pagada", data: null };
    }
    if (validatedData.cliente_id !== venta.cliente_id) {
      return { error: "El cliente del pago no coincide con la venta.", data: null };
    }
    if (validatedData.orden_id && venta.orden_id && validatedData.orden_id !== venta.orden_id) {
      return { error: "La orden del pago no coincide con la venta.", data: null };
    }

    const { data: pagosPrevios, error: pagosError } = await supabase
      .from("ledger")
      .select("monto")
      .eq("venta_id", ventaId)
      .eq("tipo", "pago")
      .eq("clinica_id", clinicaId);

    if (pagosError) {
      return { error: pagosError.message, data: null };
    }

    const totalPagadoPrevio = (pagosPrevios || []).reduce((acc: number, p: any) => acc + Number(p.monto), 0);
    const saldoPendiente = Math.max(0, Number(venta.total) - totalPagadoPrevio);
    if (validatedData.monto > saldoPendiente) {
      return { error: `El pago excede el saldo pendiente (${formatMoneyPEN(saldoPendiente)})`, data: null };
    }

    const { data: newPago, error: insertError } = await supabase
      .from("ledger")
      .insert({
        clinica_id: clinicaId,
        cliente_id: venta.cliente_id,
        venta_id: ventaId,
        orden_id: venta.orden_id,
        tipo: "pago",
        monto: validatedData.monto,
        metodo_pago: validatedData.metodo_pago,
        fecha: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting ledger pago:", insertError);
      return { error: insertError.message, data: null };
    }

    // Verificar si la venta ya está pagada por completo
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

    if (!validatedData.almacen_id || validatedData.almacen_id.length !== 36) {
      return { error: "No hay un almacén válido seleccionado (UUID inválido)", data: null };
    }

    if (validatedData.qty < 0) {
      const { data: movs } = await supabase
        .from("movimientos_stock")
        .select("qty")
        .eq("clinica_id", clinicaId)
        .eq("item_id", validatedData.item_id);
      
      const currentStock = (movs || []).reduce((acc: number, mov: any) => acc + Number(mov.qty), 0);
      
      if (currentStock + validatedData.qty < 0) {
        return { error: "Stock insuficiente para realizar esta rebaja", data: null };
      }
    }

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

export async function getCierreActual() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cierres_caja")
      .select("*")
      .eq("clinica_id", clinicaId)
      .eq("estado", "abierta")
      .maybeSingle();

    if (error) throw error;
    return { error: null, data };
  } catch (error: any) {
    return { error: error.message, data: null };
  }
}

export async function abrirCaja(input: AbrirCajaInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const validated = abrirCajaSchema.parse(input);

    // Ver si ya hay una abierta
    const { data: existing } = await supabase
      .from("cierres_caja")
      .select("id")
      .eq("clinica_id", clinicaId)
      .eq("estado", "abierta")
      .maybeSingle();

    if (existing) {
      return { error: "Ya existe una sesion de caja abierta" };
    }

    const { data, error } = await supabase
      .from("cierres_caja")
      .insert({
        clinica_id: clinicaId,
        apertura_por_user_id: user?.id,
        monto_apertura: validated.monto_apertura,
        estado: "abierta",
      })
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath("/caja");
    return { error: null, data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function cerrarCaja(input: CerrarCajaInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const validated = cerrarCajaSchema.parse(input);

    const { data: cierre } = await supabase
      .from("cierres_caja")
      .select("*")
      .eq("clinica_id", clinicaId)
      .eq("estado", "abierta")
      .single();

    if (!cierre) return { error: "No hay una caja abierta para cerrar" };

    // Calcular totales del sistema
    const { data: pagos } = await supabase
      .from("ledger")
      .select("monto, metodo_pago")
      .eq("clinica_id", clinicaId)
      .eq("tipo", "pago")
      .is("cierre_id", null); // Pagos no cerrados

    const ef = pagos?.filter(p => p.metodo_pago === "efectivo").reduce((a, b) => a + Number(b.monto), 0) || 0;
    const tj = pagos?.filter(p => p.metodo_pago === "tarjeta").reduce((a, b) => a + Number(b.monto), 0) || 0;
    const tr = pagos?.filter(p => p.metodo_pago === "transferencia").reduce((a, b) => a + Number(b.monto), 0) || 0;
    const total = ef + tj + tr;

    const { error: updateError } = await supabase
      .from("cierres_caja")
      .update({
        estado: "cerrada",
        fecha_cierre: new Date().toISOString(),
        cierre_por_user_id: user?.id,
        monto_cierre_efectivo_real: validated.monto_cierre_efectivo_real,
        monto_efectivo_sistema: ef,
        monto_tarjeta_sistema: tj,
        monto_transferencia_sistema: tr,
        total_sistema: total,
        notas: validated.notas
      })
      .eq("id", cierre.id);

    if (updateError) throw updateError;

    // Vincular pagos al cierre
    await supabase
      .from("ledger")
      .update({ cierre_id: cierre.id })
      .eq("clinica_id", clinicaId)
      .eq("tipo", "pago")
      .is("cierre_id", null);

    revalidatePath("/caja");
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getCierresHistorial() {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cierres_caja")
      .select("*")
      .eq("clinica_id", clinicaId)
      .eq("estado", "cerrada")
      .order("fecha_cierre", { ascending: false });

    if (error) throw error;
    return { error: null, data };
  } catch (error: any) {
    return { error: error.message, data: [] };
  }
}
