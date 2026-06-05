-- 0030_clinica_staff_directory.sql
-- Expone un directorio basico de staff para cualquier miembro de la clinica,
-- suficiente para mostrar "atendido por" sin abrir permisos avanzados.

create or replace function public.get_clinica_staff_directory(
  p_clinica_id uuid,
  p_user_ids uuid[] default null
)
returns table (
  user_id uuid,
  role text,
  email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from public.user_clinicas uc
    where uc.clinica_id = p_clinica_id
      and uc.user_id = auth.uid()
  ) then
    raise exception 'Access denied. Must belong to the clinic.';
  end if;

  return query
  select
    uc.user_id,
    lower(trim(uc.role))::text as role,
    au.email::text
  from public.user_clinicas uc
  left join auth.users au on uc.user_id = au.id
  where uc.clinica_id = p_clinica_id
    and (p_user_ids is null or uc.user_id = any(p_user_ids))
  order by uc.created_at asc;
end;
$$;
