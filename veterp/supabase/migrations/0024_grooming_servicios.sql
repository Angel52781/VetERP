-- 0024_grooming_servicios.sql
-- Tabla operativa de ejecución de servicios de grooming.
-- Idempotente: usa CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS.
-- No elimina datos. No toca RLS existente.

create table if not exists public.grooming_servicios (
  id                        uuid        primary key default gen_random_uuid(),
  clinica_id                uuid        not null references public.clinicas(id) on delete cascade,
  cita_id                   uuid        null references public.citas(id) on delete set null,
  mascota_id                uuid        not null references public.mascotas(id) on delete cascade,
  cliente_id                uuid        not null references public.clientes(id) on delete cascade,
  estado_text               text        not null default 'pendiente'
                              check (estado_text in ('pendiente', 'completado')),
  observaciones_text        text        null,
  servicios_realizados_text text        null,
  completado_at             timestamptz null,
  completado_por            uuid        null references auth.users(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Unique normal: requerido por PostgREST para upsert onConflict: "cita_id".
drop index if exists public.grooming_servicios_cita_id_unique;

create unique index if not exists grooming_servicios_cita_id_unique
  on public.grooming_servicios (cita_id);

-- Índices operativos
create index if not exists grooming_servicios_clinica_estado_idx
  on public.grooming_servicios (clinica_id, estado_text, created_at);

create index if not exists grooming_servicios_clinica_mascota_idx
  on public.grooming_servicios (clinica_id, mascota_id, created_at desc);

create index if not exists grooming_servicios_cita_id_idx
  on public.grooming_servicios (cita_id);

-- Trigger updated_at (reutiliza la función set_updated_at ya existente del proyecto)
drop trigger if exists grooming_servicios_set_updated_at on public.grooming_servicios;
create trigger grooming_servicios_set_updated_at
  before update on public.grooming_servicios
  for each row
  execute procedure public.set_updated_at();

-- RLS
alter table public.grooming_servicios enable row level security;

drop policy if exists "grooming_servicios_select_for_members" on public.grooming_servicios;
create policy "grooming_servicios_select_for_members"
  on public.grooming_servicios
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = grooming_servicios.clinica_id
    )
  );

drop policy if exists "grooming_servicios_insert_for_members" on public.grooming_servicios;
create policy "grooming_servicios_insert_for_members"
  on public.grooming_servicios
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = clinica_id
    )
  );

drop policy if exists "grooming_servicios_update_for_members" on public.grooming_servicios;
create policy "grooming_servicios_update_for_members"
  on public.grooming_servicios
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = grooming_servicios.clinica_id
    )
  )
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = clinica_id
    )
  );

drop policy if exists "grooming_servicios_delete_for_members" on public.grooming_servicios;
create policy "grooming_servicios_delete_for_members"
  on public.grooming_servicios
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = grooming_servicios.clinica_id
    )
  );
