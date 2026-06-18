-- Hardening multi-clínica y staff/invitaciones
-- 1) Evita auto-asignación libre a clínicas via user_clinicas
-- 2) Cierra lectura pública amplia de invitaciones
-- 3) Permite aceptación de invitación por el correo invitado autenticado

DROP POLICY IF EXISTS "user_clinicas_insert_self" ON public.user_clinicas;

CREATE POLICY "user_clinicas_insert_via_pending_invitation"
ON public.user_clinicas
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.clinica_invitations ci
    WHERE ci.clinica_id = user_clinicas.clinica_id
      AND lower(ci.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND ci.role = user_clinicas.role
      AND ci.status = 'pending'
      AND ci.expires_at > now()
  )
);

CREATE POLICY "user_clinicas_update_by_owner_admin"
ON public.user_clinicas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_clinicas actor
    WHERE actor.user_id = auth.uid()
      AND actor.clinica_id = user_clinicas.clinica_id
      AND (
        actor.role = 'owner'
        OR (actor.role = 'admin' AND user_clinicas.role <> 'owner')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_clinicas actor
    WHERE actor.user_id = auth.uid()
      AND actor.clinica_id = user_clinicas.clinica_id
      AND (
        actor.role = 'owner'
        OR (actor.role = 'admin' AND user_clinicas.role <> 'owner')
      )
  )
);

CREATE POLICY "user_clinicas_delete_by_owner_admin"
ON public.user_clinicas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_clinicas actor
    WHERE actor.user_id = auth.uid()
      AND actor.clinica_id = user_clinicas.clinica_id
      AND (
        actor.role = 'owner'
        OR (actor.role = 'admin' AND user_clinicas.role <> 'owner')
      )
  )
);

DROP POLICY IF EXISTS "invitations_select_by_id_public" ON public.clinica_invitations;

CREATE POLICY "invitations_select_for_invited_email"
ON public.clinica_invitations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND status = 'pending'
  AND expires_at > now()
);

CREATE POLICY "invitations_update_accept_for_invited_email"
ON public.clinica_invitations
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND status = 'accepted'
  AND expires_at > now()
);
