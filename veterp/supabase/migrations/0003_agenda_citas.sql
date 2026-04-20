-- Create tipo_citas table
CREATE TABLE IF NOT EXISTS public.tipo_citas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    duracion_min INT NOT NULL,
    color TEXT,
    is_disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create citas table
CREATE TABLE IF NOT EXISTS public.citas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    mascota_id UUID REFERENCES public.mascotas(id) ON DELETE CASCADE,
    tipo_cita_id UUID REFERENCES public.tipo_citas(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'programada',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add updated_at triggers
CREATE TRIGGER set_public_tipo_citas_updated_at
    BEFORE UPDATE ON public.tipo_citas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_public_citas_updated_at
    BEFORE UPDATE ON public.citas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.tipo_citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- Create policies for tipo_citas
CREATE POLICY "Select tipo_citas for authenticated users based on clinica_id"
    ON public.tipo_citas FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = tipo_citas.clinica_id
        )
    );

CREATE POLICY "Insert tipo_citas for authenticated users based on clinica_id"
    ON public.tipo_citas FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = tipo_citas.clinica_id
        )
    );

CREATE POLICY "Update tipo_citas for authenticated users based on clinica_id"
    ON public.tipo_citas FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = tipo_citas.clinica_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = tipo_citas.clinica_id
        )
    );

CREATE POLICY "Delete tipo_citas for authenticated users based on clinica_id"
    ON public.tipo_citas FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = tipo_citas.clinica_id
        )
    );

-- Create policies for citas
CREATE POLICY "Select citas for authenticated users based on clinica_id"
    ON public.citas FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = citas.clinica_id
        )
    );

CREATE POLICY "Insert citas for authenticated users based on clinica_id"
    ON public.citas FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = citas.clinica_id
        )
    );

CREATE POLICY "Update citas for authenticated users based on clinica_id"
    ON public.citas FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = citas.clinica_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = citas.clinica_id
        )
    );

CREATE POLICY "Delete citas for authenticated users based on clinica_id"
    ON public.citas FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_clinicas uc
            WHERE uc.user_id = auth.uid() AND uc.clinica_id = citas.clinica_id
        )
    );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tipo_citas_clinica_id ON public.tipo_citas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_citas_clinica_id ON public.citas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_citas_cliente_id ON public.citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_mascota_id ON public.citas(mascota_id);
CREATE INDEX IF NOT EXISTS idx_citas_tipo_cita_id ON public.citas(tipo_cita_id);
CREATE INDEX IF NOT EXISTS idx_citas_start_date ON public.citas(start_date);
