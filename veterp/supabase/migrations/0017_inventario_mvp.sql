-- ============================================================
-- Migración 0017: Inventario MVP
-- Agrega campos faltantes de forma aditiva (no destructiva).
-- ============================================================

-- 1. Enriquecer items_catalogo con campos operativos de inventario
ALTER TABLE public.items_catalogo
  ADD COLUMN IF NOT EXISTS sku              TEXT,
  ADD COLUMN IF NOT EXISTS unidad           TEXT NOT NULL DEFAULT 'unidad',
  ADD COLUMN IF NOT EXISTS costo_referencial NUMERIC,
  ADD COLUMN IF NOT EXISTS stock_minimo     NUMERIC NOT NULL DEFAULT 0;

-- 2. Enriquecer movimientos_stock con trazabilidad y lotes
ALTER TABLE public.movimientos_stock
  ADD COLUMN IF NOT EXISTS stock_anterior NUMERIC,
  ADD COLUMN IF NOT EXISTS stock_nuevo    NUMERIC,
  ADD COLUMN IF NOT EXISTS motivo         TEXT,
  ADD COLUMN IF NOT EXISTS lote           TEXT,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- 3. Ãndice para facilitar búsquedas de productos próximos a vencer
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_vencimiento
  ON public.movimientos_stock(clinica_id, fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

-- 4. Ãndice compuesto para Kardex por producto
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_item_created
  ON public.movimientos_stock(item_id, created_at DESC);
