-- Corrige roles legacy con casing inconsistente para que el módulo Staff
-- refleje fielmente los miembros reales de user_clinicas.

UPDATE public.user_clinicas
SET role = lower(trim(role))
WHERE role IS NOT NULL
  AND role <> lower(trim(role));

UPDATE public.clinica_invitations
SET role = lower(trim(role))
WHERE role IS NOT NULL
  AND role <> lower(trim(role));

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
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_clinicas
        WHERE clinica_id = p_clinica_id
          AND user_clinicas.user_id = auth.uid()
          AND lower(trim(user_clinicas.role)) IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. Must be owner or admin of the clinic.';
    END IF;

    RETURN QUERY
    SELECT
        uc.user_id,
        lower(trim(uc.role))::text AS role,
        au.email::text,
        uc.created_at
    FROM public.user_clinicas uc
    LEFT JOIN auth.users au ON uc.user_id = au.id
    WHERE uc.clinica_id = p_clinica_id
    ORDER BY uc.created_at ASC;
END;
$$;
