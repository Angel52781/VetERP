-- 0030_hce_entradas_clinicas_ediciones.sql
-- Edicion controlada de historia clinica con auditoria before/after.

alter table public.entradas_clinicas
  add column if not exists editado_at timestamptz null,
  add column if not exists editado_por uuid references auth.users(id) on delete set null,
  add column if not exists ediciones_count integer not null default 0;

create table if not exists public.entradas_clinicas_ediciones (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  entrada_clinica_id uuid not null references public.entradas_clinicas(id) on delete cascade,
  orden_id uuid not null references public.ordenes_servicio(id) on delete cascade,
  editado_por uuid references auth.users(id) on delete set null,
  motivo_text text not null,
  before_data jsonb not null,
  after_data jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.entradas_clinicas_ediciones
  is 'Auditoria de ediciones controladas sobre entradas de historia clinica.';

comment on column public.entradas_clinicas.editado_at
  is 'Fecha de la ultima edicion controlada de la entrada clinica.';

comment on column public.entradas_clinicas.editado_por
  is 'Usuario que realizo la ultima edicion controlada.';

comment on column public.entradas_clinicas.ediciones_count
  is 'Cantidad de ediciones controladas registradas para la entrada.';

create index if not exists entradas_clinicas_ediciones_entrada_idx
  on public.entradas_clinicas_ediciones (clinica_id, entrada_clinica_id, created_at desc);

alter table public.entradas_clinicas_ediciones enable row level security;

drop policy if exists "entradas_clinicas_ediciones_select" on public.entradas_clinicas_ediciones;
create policy "entradas_clinicas_ediciones_select"
  on public.entradas_clinicas_ediciones
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = entradas_clinicas_ediciones.clinica_id
    )
  );

drop policy if exists "entradas_clinicas_ediciones_insert_admin" on public.entradas_clinicas_ediciones;
create policy "entradas_clinicas_ediciones_insert_admin"
  on public.entradas_clinicas_ediciones
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = entradas_clinicas_ediciones.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
    and exists (
      select 1 from public.entradas_clinicas ec
      where ec.id = entradas_clinicas_ediciones.entrada_clinica_id
        and ec.clinica_id = entradas_clinicas_ediciones.clinica_id
        and ec.orden_id = entradas_clinicas_ediciones.orden_id
    )
  );

drop policy if exists "entradas_clinicas_update" on public.entradas_clinicas;
drop policy if exists "entradas_clinicas_update_owner_admin" on public.entradas_clinicas;
create policy "entradas_clinicas_update_owner_admin"
  on public.entradas_clinicas
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = entradas_clinicas.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = entradas_clinicas.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
  );
