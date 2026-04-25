-- Tabla: categorias_catalogo
CREATE TABLE IF NOT EXISTS public.categorias_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers updated_at
DROP TRIGGER IF EXISTS set_updated_at_categorias_catalogo ON public.categorias_catalogo;
CREATE TRIGGER set_updated_at_categorias_catalogo
    BEFORE UPDATE ON public.categorias_catalogo
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Habilitar RLS
ALTER TABLE public.categorias_catalogo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias_catalogo
CREATE POLICY "categorias_catalogo_select" ON public.categorias_catalogo FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = categorias_catalogo.clinica_id));
CREATE POLICY "categorias_catalogo_insert" ON public.categorias_catalogo FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = categorias_catalogo.clinica_id));
CREATE POLICY "categorias_catalogo_update" ON public.categorias_catalogo FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = categorias_catalogo.clinica_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = categorias_catalogo.clinica_id));
CREATE POLICY "categorias_catalogo_delete" ON public.categorias_catalogo FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = categorias_catalogo.clinica_id));

-- Índices
CREATE INDEX IF NOT EXISTS idx_categorias_catalogo_clinica_id ON public.categorias_catalogo(clinica_id);

-- Añadir categoria_id a items_catalogo
ALTER TABLE public.items_catalogo ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_catalogo(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_items_catalogo_categoria_id ON public.items_catalogo(categoria_id);
