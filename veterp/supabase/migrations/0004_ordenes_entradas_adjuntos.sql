-- Tabla: ordenes_servicio
CREATE TABLE public.ordenes_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    estado_text TEXT NOT NULL DEFAULT 'open',
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    mascota_id UUID NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
    staff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: entradas_clinicas
CREATE TABLE public.entradas_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    orden_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
    tipo_text TEXT,
    texto_text TEXT,
    autor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: adjuntos
CREATE TABLE public.adjuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    orden_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
    archivo_url TEXT NOT NULL,
    descripcion_text TEXT,
    fecha_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers updated_at
CREATE TRIGGER set_updated_at_ordenes_servicio
    BEFORE UPDATE ON public.ordenes_servicio
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_entradas_clinicas
    BEFORE UPDATE ON public.entradas_clinicas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_adjuntos
    BEFORE UPDATE ON public.adjuntos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Habilitar RLS
ALTER TABLE public.ordenes_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjuntos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ordenes_servicio
CREATE POLICY "ordenes_servicio_select" ON public.ordenes_servicio FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ordenes_servicio.clinica_id));

CREATE POLICY "ordenes_servicio_insert" ON public.ordenes_servicio FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ordenes_servicio.clinica_id));

CREATE POLICY "ordenes_servicio_update" ON public.ordenes_servicio FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ordenes_servicio.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ordenes_servicio.clinica_id));

CREATE POLICY "ordenes_servicio_delete" ON public.ordenes_servicio FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = ordenes_servicio.clinica_id));

-- Políticas RLS para entradas_clinicas
CREATE POLICY "entradas_clinicas_select" ON public.entradas_clinicas FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = entradas_clinicas.clinica_id));

CREATE POLICY "entradas_clinicas_insert" ON public.entradas_clinicas FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = entradas_clinicas.clinica_id));

CREATE POLICY "entradas_clinicas_update" ON public.entradas_clinicas FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = entradas_clinicas.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = entradas_clinicas.clinica_id));

CREATE POLICY "entradas_clinicas_delete" ON public.entradas_clinicas FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = entradas_clinicas.clinica_id));

-- Políticas RLS para adjuntos
CREATE POLICY "adjuntos_select" ON public.adjuntos FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = adjuntos.clinica_id));

CREATE POLICY "adjuntos_insert" ON public.adjuntos FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = adjuntos.clinica_id));

CREATE POLICY "adjuntos_update" ON public.adjuntos FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = adjuntos.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = adjuntos.clinica_id));

CREATE POLICY "adjuntos_delete" ON public.adjuntos FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = adjuntos.clinica_id));

-- Crear bucket de storage para adjuntos
INSERT INTO storage.buckets (id, name, public)
VALUES ('adjuntos', 'adjuntos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para adjuntos (asumiendo que los archivos se guardan con el prefijo clinica_id/...)
CREATE POLICY "Usuarios pueden ver adjuntos de su clinica"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'adjuntos' AND
    EXISTS (
        SELECT 1 FROM public.user_clinicas uc
        WHERE uc.user_id = auth.uid() AND uc.clinica_id::text = (string_to_array(name, '/'))[1]
    )
);

CREATE POLICY "Usuarios pueden subir adjuntos a su clinica"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'adjuntos' AND
    EXISTS (
        SELECT 1 FROM public.user_clinicas uc
        WHERE uc.user_id = auth.uid() AND uc.clinica_id::text = (string_to_array(name, '/'))[1]
    )
);

CREATE POLICY "Usuarios pueden actualizar adjuntos de su clinica"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'adjuntos' AND
    EXISTS (
        SELECT 1 FROM public.user_clinicas uc
        WHERE uc.user_id = auth.uid() AND uc.clinica_id::text = (string_to_array(name, '/'))[1]
    )
);

CREATE POLICY "Usuarios pueden eliminar adjuntos de su clinica"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'adjuntos' AND
    EXISTS (
        SELECT 1 FROM public.user_clinicas uc
        WHERE uc.user_id = auth.uid() AND uc.clinica_id::text = (string_to_array(name, '/'))[1]
    )
);

-- Índices
CREATE INDEX idx_ordenes_servicio_clinica_id ON public.ordenes_servicio(clinica_id);
CREATE INDEX idx_ordenes_servicio_cliente_id ON public.ordenes_servicio(cliente_id);
CREATE INDEX idx_ordenes_servicio_mascota_id ON public.ordenes_servicio(mascota_id);

CREATE INDEX idx_entradas_clinicas_clinica_id ON public.entradas_clinicas(clinica_id);
CREATE INDEX idx_entradas_clinicas_orden_id ON public.entradas_clinicas(orden_id);

CREATE INDEX idx_adjuntos_clinica_id ON public.adjuntos(clinica_id);
CREATE INDEX idx_adjuntos_orden_id ON public.adjuntos(orden_id);
