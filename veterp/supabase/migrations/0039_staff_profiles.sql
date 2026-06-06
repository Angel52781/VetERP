-- 0039_staff_profiles.sql
-- Agrega un nombre visible al staff para no usar correos en UI clinica.

ALTER TABLE public.user_clinicas ADD COLUMN IF NOT EXISTS nombre_visible_text text;

DROP FUNCTION IF EXISTS public.get_clinica_staff_directory(uuid, uuid[]);
CREATE OR REPLACE FUNCTION public.get_clinica_staff_directory(
  p_clinica_id uuid,
  p_user_ids uuid[] default null
)
RETURNS TABLE (
  user_id uuid,
  role text,
  email text,
  nombre_visible_text text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_clinicas uc
    WHERE uc.clinica_id = p_clinica_id
      AND uc.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Must belong to the clinic.';
  END IF;

  RETURN QUERY
  SELECT
    uc.user_id,
    lower(trim(uc.role))::text as role,
    au.email::text,
    uc.nombre_visible_text
  FROM public.user_clinicas uc
  LEFT JOIN auth.users au ON uc.user_id = au.id
  WHERE uc.clinica_id = p_clinica_id
    AND (p_user_ids IS NULL OR uc.user_id = ANY(p_user_ids))
  ORDER BY uc.created_at ASC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_clinica_staff(uuid);
CREATE OR REPLACE FUNCTION public.get_clinica_staff(p_clinica_id UUID)
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    email TEXT,
    created_at TIMESTAMPTZ,
    nombre_visible_text TEXT
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
        uc.created_at,
        uc.nombre_visible_text
    FROM public.user_clinicas uc
    LEFT JOIN auth.users au ON uc.user_id = au.id
    WHERE uc.clinica_id = p_clinica_id
    ORDER BY uc.created_at ASC;
END;
$$;