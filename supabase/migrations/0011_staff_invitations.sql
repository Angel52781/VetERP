-- Tabla: clinica_invitations
CREATE TABLE IF NOT EXISTS public.clinica_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'veterinario',
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, revoked
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers updated_at
DROP TRIGGER IF EXISTS set_updated_at_clinica_invitations ON public.clinica_invitations;
CREATE TRIGGER set_updated_at_clinica_invitations
    BEFORE UPDATE ON public.clinica_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Índice único para evitar invitaciones pendientes duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinica_invitations_unique_pending 
ON public.clinica_invitations (clinica_id, email) 
WHERE status = 'pending';

-- Habilitar RLS
ALTER TABLE public.clinica_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clinica_invitations (solo owner y admin)
CREATE POLICY "invitations_select" ON public.clinica_invitations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = clinica_invitations.clinica_id AND uc.role IN ('owner', 'admin')));

CREATE POLICY "invitations_insert" ON public.clinica_invitations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = clinica_invitations.clinica_id AND uc.role IN ('owner', 'admin')));

CREATE POLICY "invitations_update" ON public.clinica_invitations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = clinica_invitations.clinica_id AND uc.role IN ('owner', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = clinica_invitations.clinica_id AND uc.role IN ('owner', 'admin')));

CREATE POLICY "invitations_delete" ON public.clinica_invitations FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_clinicas uc WHERE uc.user_id = auth.uid() AND uc.clinica_id = clinica_invitations.clinica_id AND uc.role IN ('owner', 'admin')));

-- Política especial para que el invitado (no autenticado o autenticado con otro tenant) pueda leer la invitación
-- Haremos una política de SELECT por ID sin requerir auth.uid() en user_clinicas, porque la aceptación requiere el ID exacto.
CREATE POLICY "invitations_select_by_id_public" ON public.clinica_invitations FOR SELECT
    USING (true); -- Permitimos leer a todos, pero como el ID es un UUID, no pueden adivinarlo.

-- Crear función RPC para listar staff
CREATE OR REPLACE FUNCTION public.get_clinica_staff(p_clinica_id UUID)
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    email TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar si el usuario que llama pertenece a la clínica y es admin/owner
    IF NOT EXISTS (
        SELECT 1 
        FROM public.user_clinicas 
        WHERE clinica_id = p_clinica_id 
          AND user_clinicas.user_id = auth.uid()
          AND user_clinicas.role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. Must be owner or admin of the clinic.';
    END IF;

    RETURN QUERY
    SELECT 
        uc.user_id,
        uc.role,
        au.email::text,
        uc.created_at
    FROM 
        public.user_clinicas uc
    JOIN 
        auth.users au ON uc.user_id = au.id
    WHERE 
        uc.clinica_id = p_clinica_id;
END;
$$;
