-- Tabla: almacenes
CREATE TABLE IF NOT EXISTS public.almacenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: movimientos_stock
CREATE TABLE IF NOT EXISTS public.movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items_catalogo(id) ON DELETE CASCADE,
    almacen_id UUID NOT NULL REFERENCES public.almacenes(id) ON DELETE CASCADE,
    qty NUMERIC NOT NULL, -- positivo para entradas, negativo para salidas
    tipo TEXT NOT NULL, -- 'venta', 'ajuste', 'compra', etc.
    notas TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers updated_at
DROP TRIGGER IF EXISTS set_updated_at_almacenes ON public.almacenes;
CREATE TRIGGER set_updated_at_almacenes
    BEFORE UPDATE ON public.almacenes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_movimientos_stock ON public.movimientos_stock;
CREATE TRIGGER set_updated_at_movimientos_stock
    BEFORE UPDATE ON public.movimientos_stock
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Habilitar RLS
ALTER TABLE public.almacenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para almacenes
CREATE POLICY "almacenes_select" ON public.almacenes FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = almacenes.clinica_id));
CREATE POLICY "almacenes_insert" ON public.almacenes FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = almacenes.clinica_id));
CREATE POLICY "almacenes_update" ON public.almacenes FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = almacenes.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = almacenes.clinica_id));
CREATE POLICY "almacenes_delete" ON public.almacenes FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = almacenes.clinica_id));

-- Políticas RLS para movimientos_stock
CREATE POLICY "movimientos_stock_select" ON public.movimientos_stock FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = movimientos_stock.clinica_id));
CREATE POLICY "movimientos_stock_insert" ON public.movimientos_stock FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = movimientos_stock.clinica_id));
CREATE POLICY "movimientos_stock_update" ON public.movimientos_stock FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = movimientos_stock.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = movimientos_stock.clinica_id));
CREATE POLICY "movimientos_stock_delete" ON public.movimientos_stock FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = movimientos_stock.clinica_id));

-- Índices
CREATE INDEX IF NOT EXISTS idx_almacenes_clinica_id ON public.almacenes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_clinica_id ON public.movimientos_stock(clinica_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_item_id ON public.movimientos_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_almacen_id ON public.movimientos_stock(almacen_id);
