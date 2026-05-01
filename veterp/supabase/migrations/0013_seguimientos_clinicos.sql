-- Bloque B (slice mínimo): seguimiento clínico recurrente por mascota
-- Permite registrar vacunas/controles con última aplicación y próxima fecha.

CREATE TABLE IF NOT EXISTS public.seguimientos_clinicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    mascota_id UUID NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
    orden_id UUID REFERENCES public.ordenes_servicio(id) ON DELETE SET NULL,
    tipo_text TEXT NOT NULL CHECK (tipo_text IN ('vacuna', 'control')),
    nombre_text TEXT NOT NULL,
    fecha_aplicacion_date DATE NOT NULL,
    proxima_fecha_date DATE,
    notas_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_seguimientos_clinicos
    BEFORE UPDATE ON public.seguimientos_clinicos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.seguimientos_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seguimientos_clinicos_select" ON public.seguimientos_clinicos FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = seguimientos_clinicos.clinica_id));

CREATE POLICY "seguimientos_clinicos_insert" ON public.seguimientos_clinicos FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = seguimientos_clinicos.clinica_id));

CREATE POLICY "seguimientos_clinicos_update" ON public.seguimientos_clinicos FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = seguimientos_clinicos.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = seguimientos_clinicos.clinica_id));

CREATE POLICY "seguimientos_clinicos_delete" ON public.seguimientos_clinicos FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = seguimientos_clinicos.clinica_id));

CREATE INDEX IF NOT EXISTS idx_seguimientos_clinicos_clinica_id
    ON public.seguimientos_clinicos(clinica_id);

CREATE INDEX IF NOT EXISTS idx_seguimientos_clinicos_mascota_id
    ON public.seguimientos_clinicos(mascota_id);

CREATE INDEX IF NOT EXISTS idx_seguimientos_clinicos_proxima_fecha
    ON public.seguimientos_clinicos(clinica_id, proxima_fecha_date);
