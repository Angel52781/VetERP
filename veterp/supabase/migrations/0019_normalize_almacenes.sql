-- Normalize "Almacen Principal" to "Almacén Principal" if there are duplicates
-- Idempotent and safe. Reassigns movements from duplicate to the target one before deleting.

DO $$
DECLARE
    rec RECORD;
    target_id UUID;
    duplicate_id UUID;
BEGIN
    FOR rec IN SELECT id AS clinica_id FROM public.clinicas
    LOOP
        -- Find the correct one with accent
        SELECT id INTO target_id
        FROM public.almacenes
        WHERE clinica_id = rec.clinica_id AND nombre = 'Almacén Principal'
        ORDER BY created_at ASC
        LIMIT 1;

        -- Find the incorrect one without accent
        SELECT id INTO duplicate_id
        FROM public.almacenes
        WHERE clinica_id = rec.clinica_id AND nombre = 'Almacen Principal'
        ORDER BY created_at ASC
        LIMIT 1;

        -- If both exist, merge them
        IF target_id IS NOT NULL AND duplicate_id IS NOT NULL AND target_id != duplicate_id THEN
            -- Reassign movements
            UPDATE public.movimientos_stock
            SET almacen_id = target_id
            WHERE almacen_id = duplicate_id;

            -- Delete the duplicate
            DELETE FROM public.almacenes
            WHERE id = duplicate_id;
        ELSIF duplicate_id IS NOT NULL AND target_id IS NULL THEN
            -- Only the one without accent exists, just rename it
            UPDATE public.almacenes
            SET nombre = 'Almacén Principal'
            WHERE id = duplicate_id;
        END IF;
    END LOOP;
END $$;
