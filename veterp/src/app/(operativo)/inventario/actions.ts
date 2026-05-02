"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies, requireUserRole } from "@/lib/clinica";
import {
  itemInventarioSchema,
  type ItemInventarioInput,
  movimientoInventarioSchema,
  type MovimientoInventarioInput,
} from "@/lib/validators/ajustes";
import { revalidatePath } from "next/cache";
import type { ProductoInventario, MovimientoKardex } from "./types";



export async function getProductosInventario(): Promise<{
  error: string | null;
  data: ProductoInventario[];
}> {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const [productosRes, movimientosRes] = await Promise.all([
      supabase
        .from("items_catalogo")
        .select(
          `id, nombre, descripcion, kind, sku, unidad, precio_inc, costo_referencial, stock_minimo, is_disabled, proveedor_id, categoria_id,
           proveedores ( nombre ),
           categorias_catalogo ( nombre )`
        )
        .eq("clinica_id", clinicaId)
        .eq("kind", "producto")
        .order("nombre"),
      supabase
        .from("movimientos_stock")
        .select("item_id, qty")
        .eq("clinica_id", clinicaId),
    ]);

    if (productosRes.error) {
      return { error: productosRes.error.message, data: [] };
    }

    const stockMap: Record<string, number> = {};
    for (const mov of movimientosRes.data ?? []) {
      stockMap[mov.item_id] = (stockMap[mov.item_id] ?? 0) + Number(mov.qty);
    }

    const data: ProductoInventario[] = (productosRes.data ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? null,
      kind: p.kind as "producto" | "servicio",
      sku: (p.sku as string | null) ?? null,
      unidad: (p.unidad as string) ?? "unidad",
      precio_inc: Number(p.precio_inc ?? 0),
      costo_referencial: p.costo_referencial != null ? Number(p.costo_referencial) : null,
      stock_minimo: Number(p.stock_minimo ?? 0),
      is_disabled: Boolean(p.is_disabled),
      proveedor_id: p.proveedor_id ?? null,
      categoria_id: p.categoria_id ?? null,
      proveedores: (p.proveedores as unknown) as { nombre: string } | null,
      categorias_catalogo: (p.categorias_catalogo as unknown) as { nombre: string } | null,
      stock: stockMap[p.id] ?? 0,
    }));

    return { error: null, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener productos";
    return { error: msg, data: [] };
  }
}

export async function crearProducto(input: ItemInventarioInput): Promise<{
  error: string | null;
  data: { id: string } | null;
}> {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();
    const validated = itemInventarioSchema.parse(input);

    const { data, error } = await supabase
      .from("items_catalogo")
      .insert({
        clinica_id: clinicaId,
        nombre: validated.nombre,
        descripcion: validated.descripcion ?? null,
        kind: validated.kind,
        sku: validated.sku ?? null,
        unidad: validated.unidad,
        precio_inc: validated.precio_inc,
        costo_referencial: validated.costo_referencial ?? null,
        stock_minimo: validated.stock_minimo,
        proveedor_id: validated.proveedor_id ?? null,
        categoria_id: validated.categoria_id ?? null,
        is_disabled: validated.is_disabled ?? false,
      })
      .select("id")
      .single();

    if (error) return { error: error.message, data: null };

    // Registrar stock inicial si aplica
    if (validated.stock_inicial && validated.stock_inicial > 0 && validated.almacen_inicial_id) {
      const movInput: MovimientoInventarioInput = {
        item_id: data.id,
        almacen_id: validated.almacen_inicial_id,
        tipo: "inventario_inicial",
        qty: validated.stock_inicial,
        motivo: "inventario_inicial",
        notas: "Stock inicial al registrar producto",
        lote: validated.lote_inicial ?? null,
        fecha_vencimiento: validated.fecha_vencimiento_inicial ?? null,
      };
      
      const movRes = await registrarMovimientoInventario(movInput);
      if (movRes.error) {
        // En un caso real podríamos hacer rollback o avisar, pero ya se creó el producto.
        console.error("Error al registrar stock inicial:", movRes.error);
        return { error: `Producto creado, pero falló el stock inicial: ${movRes.error}`, data };
      }
    }

    revalidatePath("/(operativo)/inventario", "page");
    return { error: null, data };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al crear producto", data: null };
  }
}

export async function actualizarProducto(
  id: string,
  input: ItemInventarioInput
): Promise<{ error: string | null; data: { id: string } | null }> {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();
    const validated = itemInventarioSchema.parse(input);

    const { data, error } = await supabase
      .from("items_catalogo")
      .update({
        nombre: validated.nombre,
        descripcion: validated.descripcion ?? null,
        kind: validated.kind,
        sku: validated.sku ?? null,
        unidad: validated.unidad,
        precio_inc: validated.precio_inc,
        costo_referencial: validated.costo_referencial ?? null,
        stock_minimo: validated.stock_minimo,
        proveedor_id: validated.proveedor_id ?? null,
        categoria_id: validated.categoria_id ?? null,
        is_disabled: validated.is_disabled ?? false,
      })
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .select("id")
      .single();

    if (error) return { error: error.message, data: null };

    revalidatePath("/(operativo)/inventario", "page");
    return { error: null, data };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al actualizar", data: null };
  }
}

// ─── Movimientos ─────────────────────────────────────────────────────────────

export async function registrarMovimientoInventario(
  input: MovimientoInventarioInput
): Promise<{ error: string | null; data: { id: string } | null }> {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin", "veterinario"]);
    const supabase = await createClient();
    const validated = movimientoInventarioSchema.parse(input);

    const { data: producto, error: prodError } = await supabase
      .from("items_catalogo")
      .select("id")
      .eq("id", validated.item_id)
      .eq("clinica_id", clinicaId)
      .single();

    if (prodError || !producto) {
      return { error: "Producto no encontrado en esta clínica", data: null };
    }

    const { data: almacen, error: almacenError } = await supabase
      .from("almacenes")
      .select("id")
      .eq("id", validated.almacen_id)
      .eq("clinica_id", clinicaId)
      .single();

    if (almacenError || !almacen) {
      return { error: "El almacén seleccionado no es válido o no pertenece a esta clínica", data: null };
    }

    const { data: movs } = await supabase
      .from("movimientos_stock")
      .select("qty")
      .eq("item_id", validated.item_id)
      .eq("clinica_id", clinicaId);

    const stockActual = (movs ?? []).reduce((acc, m) => acc + Number(m.qty), 0);

    const esEgreso = ["salida", "merma"].includes(validated.tipo);
    const qtyAbsoluto = Math.abs(validated.qty);

    let qtyReal: number;
    if (validated.tipo === "ajuste_manual" || validated.tipo === "correccion") {
      qtyReal = validated.qty;
    } else if (esEgreso) {
      qtyReal = -qtyAbsoluto;
    } else {
      qtyReal = qtyAbsoluto;
    }

    if (esEgreso && stockActual + qtyReal < 0) {
      return {
        error: `Stock insuficiente. Stock actual: ${stockActual}, intentas retirar: ${qtyAbsoluto}.`,
        data: null,
      };
    }

    const stockNuevo = stockActual + qtyReal;
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("movimientos_stock")
      .insert({
        clinica_id: clinicaId,
        item_id: validated.item_id,
        almacen_id: validated.almacen_id,
        qty: qtyReal,
        tipo: validated.tipo,
        motivo: validated.motivo ?? null,
        notas: validated.notas ?? null,
        stock_anterior: stockActual,
        stock_nuevo: stockNuevo,
        lote: validated.lote ?? null,
        fecha_vencimiento: validated.fecha_vencimiento ?? null,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message, data: null };

    revalidatePath("/(operativo)/inventario", "page");
    return { error: null, data };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al registrar movimiento", data: null };
  }
}

// ─── Kardex ──────────────────────────────────────────────────────────────────

export async function getKardexProducto(
  itemId: string,
  limit = 50
): Promise<{ error: string | null; data: MovimientoKardex[] }> {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data: producto } = await supabase
      .from("items_catalogo")
      .select("id")
      .eq("id", itemId)
      .eq("clinica_id", clinicaId)
      .single();

    if (!producto) return { error: "Producto no encontrado en esta clínica", data: [] };

    const { data, error } = await supabase
      .from("movimientos_stock")
      .select(
        `id, tipo, qty, stock_anterior, stock_nuevo, motivo, notas, lote, fecha_vencimiento, created_at,
         almacenes ( nombre )`
      )
      .eq("clinica_id", clinicaId)
      .eq("item_id", itemId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { error: error.message, data: [] };

    const kardex: MovimientoKardex[] = (data ?? []).map((m) => ({
      id: m.id,
      tipo: m.tipo,
      qty: Number(m.qty),
      stock_anterior: m.stock_anterior != null ? Number(m.stock_anterior) : null,
      stock_nuevo: m.stock_nuevo != null ? Number(m.stock_nuevo) : null,
      motivo: (m as Record<string, unknown>).motivo as string | null ?? null,
      notas: m.notas ?? null,
      lote: (m as Record<string, unknown>).lote as string | null ?? null,
      fecha_vencimiento: (m as Record<string, unknown>).fecha_vencimiento as string | null ?? null,
      created_at: m.created_at,
      almacenes: (m.almacenes as unknown) as { nombre: string } | null,
    }));

    return { error: null, data: kardex };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al obtener kardex", data: [] };
  }
}
