-- 0031_mascota_adjuntos.sql
-- Adjuntos clinicos longitudinales del paciente/mascota.
-- Reutiliza el bucket privado existente "adjuntos"; no crea bucket publico.

create table if not exists public.mascota_adjuntos (
  id                   uuid        primary key default gen_random_uuid(),
  clinica_id           uuid        not null references public.clinicas(id) on delete cascade,
  mascota_id           uuid        not null references public.mascotas(id) on delete cascade,
  cliente_id           uuid        null references public.clientes(id) on delete set null,
  nombre_archivo_text  text        not null,
  tipo_text            text        not null default 'otro'
                                      check (tipo_text in ('examen', 'foto', 'receta', 'documento', 'otro')),
  storage_path_text    text        not null,
  mime_type_text       text        null,
  size_bytes           bigint      null check (size_bytes is null or size_bytes >= 0),
  notas_text           text        null,
  subido_por           uuid        references auth.users(id) on delete set null,
  created_at           timestamptz not null default now()
);

comment on table public.mascota_adjuntos
  is 'Adjuntos clinicos asociados directamente a una mascota/paciente. Los archivos viven en storage privado con URLs firmadas.';

create index if not exists mascota_adjuntos_mascota_idx
  on public.mascota_adjuntos (clinica_id, mascota_id, created_at desc);

create index if not exists mascota_adjuntos_tipo_idx
  on public.mascota_adjuntos (clinica_id, tipo_text);

alter table public.mascota_adjuntos enable row level security;

drop policy if exists "mascota_adjuntos_select_for_members" on public.mascota_adjuntos;
create policy "mascota_adjuntos_select_for_members"
  on public.mascota_adjuntos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = mascota_adjuntos.clinica_id
    )
  );

drop policy if exists "mascota_adjuntos_insert_for_members" on public.mascota_adjuntos;
create policy "mascota_adjuntos_insert_for_members"
  on public.mascota_adjuntos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = mascota_adjuntos.clinica_id
    )
    and exists (
      select 1
      from public.mascotas m
      where m.id = mascota_adjuntos.mascota_id
        and m.clinica_id = mascota_adjuntos.clinica_id
        and (
          mascota_adjuntos.cliente_id is null
          or m.cliente_id = mascota_adjuntos.cliente_id
        )
    )
  );

drop policy if exists "mascota_adjuntos_update_owner_admin" on public.mascota_adjuntos;
create policy "mascota_adjuntos_update_owner_admin"
  on public.mascota_adjuntos
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = mascota_adjuntos.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.user_clinicas uc
      where uc.user_id = (select auth.uid())
        and uc.clinica_id = mascota_adjuntos.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin')
    )
    and exists (
      select 1
      from public.mascotas m
      where m.id = mascota_adjuntos.mascota_id
        and m.clinica_id = mascota_adjuntos.clinica_id
        and (
          mascota_adjuntos.cliente_id is null
          or m.cliente_id = mascota_adjuntos.cliente_id
        )
    )
  );
