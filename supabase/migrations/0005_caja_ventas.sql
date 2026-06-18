-- Tabla: proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: items_catalogo
CREATE TABLE IF NOT EXISTS public.items_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    kind TEXT NOT NULL, -- 'producto' o 'servicio'
    precio_inc NUMERIC NOT NULL DEFAULT 0,
    is_disabled BOOLEAN NOT NULL DEFAULT false,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: ventas
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    orden_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE SET NULL,
    estado TEXT NOT NULL DEFAULT 'abierta',
    total NUMERIC NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: items_venta
CREATE TABLE IF NOT EXISTS public.items_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items_catalogo(id) ON DELETE CASCADE,
    cantidad NUMERIC NOT NULL DEFAULT 1,
    precio_unitario NUMERIC NOT NULL DEFAULT 0,
    total_linea NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: ledger
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    venta_id UUID REFERENCES public.ventas(id) ON DELETE SET NULL,
    orden_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL, -- 'pago', 'cargo', etc.
    monto NUMERIC NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers updated_at
DROP TRIGGER IF EXISTS set_updated_at_proveedores ON public.proveedores;
CREATE TRIGGER set_updated_at_proveedores
    BEFORE UPDATE ON public.proveedores
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_items_catalogo ON public.items_catalogo;
CREATE TRIGGER set_updated_at_items_catalogo
    BEFORE UPDATE ON public.items_catalogo
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_ventas ON public.ventas;
CREATE TRIGGER set_updated_at_ventas
    BEFORE UPDATE ON public.ventas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_items_venta ON public.items_venta;
CREATE TRIGGER set_updated_at_items_venta
    BEFORE UPDATE ON public.items_venta
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_ledger ON public.ledger;
CREATE TRIGGER set_updated_at_ledger
    BEFORE UPDATE ON public.ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Habilitar RLS
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proveedores
CREATE POLICY "proveedores_select" ON public.proveedores FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = proveedores.clinica_id));
CREATE POLICY "proveedores_insert" ON public.proveedores FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = proveedores.clinica_id));
CREATE POLICY "proveedores_update" ON public.proveedores FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = proveedores.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = proveedores.clinica_id));
CREATE POLICY "proveedores_delete" ON public.proveedores FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = proveedores.clinica_id));

-- Políticas RLS para items_catalogo
CREATE POLICY "items_catalogo_select" ON public.items_catalogo FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_catalogo.clinica_id));
CREATE POLICY "items_catalogo_insert" ON public.items_catalogo FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_catalogo.clinica_id));
CREATE POLICY "items_catalogo_update" ON public.items_catalogo FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_catalogo.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_catalogo.clinica_id));
CREATE POLICY "items_catalogo_delete" ON public.items_catalogo FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_catalogo.clinica_id));

-- Políticas RLS para ventas
CREATE POLICY "ventas_select" ON public.ventas FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ventas.clinica_id));
CREATE POLICY "ventas_insert" ON public.ventas FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ventas.clinica_id));
CREATE POLICY "ventas_update" ON public.ventas FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ventas.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ventas.clinica_id));
CREATE POLICY "ventas_delete" ON public.ventas FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ventas.clinica_id));

-- Políticas RLS para items_venta
CREATE POLICY "items_venta_select" ON public.items_venta FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_venta.clinica_id));
CREATE POLICY "items_venta_insert" ON public.items_venta FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_venta.clinica_id));
CREATE POLICY "items_venta_update" ON public.items_venta FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_venta.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_venta.clinica_id));
CREATE POLICY "items_venta_delete" ON public.items_venta FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = items_venta.clinica_id));

-- Políticas RLS para ledger
CREATE POLICY "ledger_select" ON public.ledger FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ledger.clinica_id));
CREATE POLICY "ledger_insert" ON public.ledger FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ledger.clinica_id));
CREATE POLICY "ledger_update" ON public.ledger FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ledger.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ledger.clinica_id));
CREATE POLICY "ledger_delete" ON public.ledger FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ledger.clinica_id));

-- Índices
CREATE INDEX IF NOT EXISTS idx_proveedores_clinica_id ON public.proveedores(clinica_id);

CREATE INDEX IF NOT EXISTS idx_items_catalogo_clinica_id ON public.items_catalogo(clinica_id);
CREATE INDEX IF NOT EXISTS idx_items_catalogo_proveedor_id ON public.items_catalogo(proveedor_id);

CREATE INDEX IF NOT EXISTS idx_ventas_clinica_id ON public.ventas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON public.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_orden_id ON public.ventas(orden_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created_by ON public.ventas(created_by);

CREATE INDEX IF NOT EXISTS idx_items_venta_clinica_id ON public.items_venta(clinica_id);
CREATE INDEX IF NOT EXISTS idx_items_venta_venta_id ON public.items_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_items_venta_item_id ON public.items_venta(item_id);

CREATE INDEX IF NOT EXISTS idx_ledger_clinica_id ON public.ledger(clinica_id);
CREATE INDEX IF NOT EXISTS idx_ledger_cliente_id ON public.ledger(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ledger_venta_id ON public.ledger(venta_id);
CREATE INDEX IF NOT EXISTS idx_ledger_orden_id ON public.ledger(orden_id);
