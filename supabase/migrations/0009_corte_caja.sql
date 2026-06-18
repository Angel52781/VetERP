-- Tabla para cierres de caja
CREATE TABLE IF NOT EXISTS public.cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    apertura_por_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    cierre_por_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    monto_apertura NUMERIC NOT NULL DEFAULT 0,
    monto_cierre_efectivo_real NUMERIC,
    monto_efectivo_sistema NUMERIC NOT NULL DEFAULT 0,
    monto_tarjeta_sistema NUMERIC NOT NULL DEFAULT 0,
    monto_transferencia_sistema NUMERIC NOT NULL DEFAULT 0,
    total_sistema NUMERIC NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'abierta', -- 'abierta', 'cerrada'
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Añadir campos al ledger para soportar cierres
ALTER TABLE public.ledger ADD COLUMN IF NOT EXISTS metodo_pago TEXT; -- 'efectivo', 'tarjeta', 'transferencia'
ALTER TABLE public.ledger ADD COLUMN IF NOT EXISTS cierre_id UUID REFERENCES public.cierres_caja(id) ON DELETE SET NULL;

-- Triggers updated_at para cierres_caja
CREATE TRIGGER set_updated_at_cierres_caja
    BEFORE UPDATE ON public.cierres_caja
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- RLS para cierres_caja
ALTER TABLE public.cierres_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cierres_caja_select" ON public.cierres_caja FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = cierres_caja.clinica_id));

CREATE POLICY "cierres_caja_insert" ON public.cierres_caja FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = cierres_caja.clinica_id AND uc.role IN ('owner', 'admin')));

CREATE POLICY "cierres_caja_update" ON public.cierres_caja FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = cierres_caja.clinica_id AND uc.role IN ('owner', 'admin')));

-- Índices
CREATE INDEX IF NOT EXISTS idx_cierres_caja_clinica_id ON public.cierres_caja(clinica_id);
CREATE INDEX IF NOT EXISTS idx_ledger_cierre_id ON public.ledger(cierre_id);
CREATE INDEX IF NOT EXISTS idx_ledger_metodo_pago ON public.ledger(metodo_pago);
