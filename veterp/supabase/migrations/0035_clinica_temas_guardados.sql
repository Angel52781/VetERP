create table if not exists public.clinica_temas_guardados (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  nombre_text text not null,
  theme_preset_text text not null default 'default',
  brand_color_text text not null,
  orden_int int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinica_temas_guardados_nombre_check
    check (length(trim(nombre_text)) between 1 and 40),
  constraint clinica_temas_guardados_theme_preset_check
    check (theme_preset_text in ('default', 'blue', 'green', 'purple', 'warm', 'high_contrast')),
  constraint clinica_temas_guardados_brand_color_check
    check (brand_color_text ~ '^#[0-9A-Fa-f]{6}$'),
  constraint clinica_temas_guardados_orden_check
    check (orden_int >= 0)
);

comment on table public.clinica_temas_guardados is
  'Temas visuales personalizados guardados por clinica para reutilizar preset y color principal.';

create index if not exists clinica_temas_guardados_clinica_orden_created_idx
  on public.clinica_temas_guardados (clinica_id, orden_int, created_at);

create unique index if not exists clinica_temas_guardados_clinica_nombre_unique_idx
  on public.clinica_temas_guardados (clinica_id, lower(trim(nombre_text)));

alter table public.clinica_temas_guardados enable row level security;

drop policy if exists "clinica_temas_guardados_select_for_members" on public.clinica_temas_guardados;
create policy "clinica_temas_guardados_select_for_members"
  on public.clinica_temas_guardados
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = clinica_temas_guardados.clinica_id
    )
  );

drop policy if exists "clinica_temas_guardados_insert_owner_admin" on public.clinica_temas_guardados;
create policy "clinica_temas_guardados_insert_owner_admin"
  on public.clinica_temas_guardados
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = clinica_temas_guardados.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
  );

drop policy if exists "clinica_temas_guardados_update_owner_admin" on public.clinica_temas_guardados;
create policy "clinica_temas_guardados_update_owner_admin"
  on public.clinica_temas_guardados
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = clinica_temas_guardados.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = clinica_temas_guardados.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
  );

drop policy if exists "clinica_temas_guardados_delete_owner_admin" on public.clinica_temas_guardados;
create policy "clinica_temas_guardados_delete_owner_admin"
  on public.clinica_temas_guardados
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = clinica_temas_guardados.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
  );
