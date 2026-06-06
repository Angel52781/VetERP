-- 0041_registros_previos_anulacion_rpc.sql
-- Funcion segura para anular registros previos sin exponer UPDATE en RLS.

CREATE OR REPLACE FUNCTION public.anular_registro_previo(
    p_registro_id uuid,
    p_motivo_anulacion_text text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_clinica_id uuid;
    v_user_role text;
    v_anulado_at timestamptz;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'No autorizado.';
    END IF;

    IF p_motivo_anulacion_text IS NULL OR trim(p_motivo_anulacion_text) = '' THEN
        RAISE EXCEPTION 'El motivo de anulacion es obligatorio.';
    END IF;

    SELECT clinica_id, anulado_at
    INTO v_clinica_id, v_anulado_at
    FROM public.registros_previos
    WHERE id = p_registro_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El registro previo no existe.';
    END IF;

    IF v_anulado_at IS NOT NULL THEN
        RAISE EXCEPTION 'El registro previo ya se encuentra anulado.';
    END IF;

    SELECT lower(trim(role))
    INTO v_user_role
    FROM public.user_clinicas
    WHERE user_id = auth.uid()
      AND clinica_id = v_clinica_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No perteneces a la clinica de este registro.';
    END IF;

    IF v_user_role NOT IN ('owner', 'admin', 'veterinario') THEN
        RAISE EXCEPTION 'No tienes permisos para anular un antecedente clinico.';
    END IF;

    UPDATE public.registros_previos
    SET
        anulado_at = now(),
        anulado_por = auth.uid(),
        motivo_anulacion_text = trim(p_motivo_anulacion_text),
        updated_at = now()
    WHERE id = p_registro_id;
END;
$$;

REVOKE ALL ON FUNCTION public.anular_registro_previo(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anular_registro_previo(uuid, text) TO authenticated;