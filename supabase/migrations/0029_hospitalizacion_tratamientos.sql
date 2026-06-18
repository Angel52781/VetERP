-- 0029_hospitalizacion_tratamientos.sql
-- Ficha operativa de tratamientos en hospitalizacion.
-- No descuenta stock, no factura y no registra administracion por dosis.

create table if not exists public.hospitalizacion_tratamientos (
  id                    uuid        primary key default gen_random_uuid(),
  clinica_id            uuid        not null references public.clinicas(id) on delete cascade,
  hospitalizacion_id    uuid        not null references public.hospitalizaciones(id) on delete cascade,
  mascota_id            uuid        not null references public.mascotas(id) on delete cascade,
  nombre_text           text        not null,
  dosis_text            text        null,
  via_text              text        null,
  frecuencia_text       text        null,
  indicaciones_text     text        null,
  responsable_text      text        null,
  notas_text            text        null,
  orden_num             integer     null,
  estado_text           text        not null default 'activo'
                                      check (estado_text in ('activo', 'terminado', 'suspendido')),
  iniciado_at           timestamptz not null default now(),
  terminado_at          timestamptz null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint hospitalizacion_tratamientos_orden_check
    check (orden_num is null or (orden_num >= 0 and orden_num <= 999))
);

comment on table public.hospitalizacion_tratamientos
  is 'Tratamientos operativos dentro de hospitalizacion. Permite farmacos y tratamientos no farmacologicos sin inventario ni facturacion.';

create index if not exists hospitalizacion_tratamientos_clinica_idx
  on public.hospitalizacion_tratamientos (clinica_id);

create index if not exists hospitalizacion_tratamientos_clinica_hosp_estado_idx
  on public.hospitalizacion_tratamientos (clinica_id, hospitalizacion_id, estado_text);

create index if not exists hospitalizacion_tratamientos_clinica_mascota_idx
  on public.hospitalizacion_tratamientos (clinica_id, mascota_id);

drop trigger if exists hospitalizacion_tratamientos_set_updated_at on public.hospitalizacion_tratamientos;
create trigger hospitalizacion_tratamientos_set_updated_at
  before update on public.hospitalizacion_tratamientos
  for each row
  execute procedure public.set_updated_at();

alter table public.hospitalizacion_tratamientos enable row level security;

drop policy if exists "hospitalizacion_tratamientos_select_for_members" on public.hospitalizacion_tratamientos;
create policy "hospitalizacion_tratamientos_select_for_members"
  on public.hospitalizacion_tratamientos
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_tratamientos.clinica_id
    )
  );

drop policy if exists "hospitalizacion_tratamientos_insert_for_members" on public.hospitalizacion_tratamientos;
create policy "hospitalizacion_tratamientos_insert_for_members"
  on public.hospitalizacion_tratamientos
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_tratamientos.clinica_id
    )
    and exists (
      select 1 from public.hospitalizaciones h
      where h.id = hospitalizacion_tratamientos.hospitalizacion_id
        and h.clinica_id = hospitalizacion_tratamientos.clinica_id
        and h.mascota_id = hospitalizacion_tratamientos.mascota_id
    )
  );

drop policy if exists "hospitalizacion_tratamientos_update_for_members" on public.hospitalizacion_tratamientos;
create policy "hospitalizacion_tratamientos_update_for_members"
  on public.hospitalizacion_tratamientos
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_tratamientos.clinica_id
    )
  )
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_tratamientos.clinica_id
    )
    and exists (
      select 1 from public.hospitalizaciones h
      where h.id = hospitalizacion_tratamientos.hospitalizacion_id
        and h.clinica_id = hospitalizacion_tratamientos.clinica_id
        and h.mascota_id = hospitalizacion_tratamientos.mascota_id
    )
  );

drop policy if exists "hospitalizacion_tratamientos_delete_for_members" on public.hospitalizacion_tratamientos;
create policy "hospitalizacion_tratamientos_delete_for_members"
  on public.hospitalizacion_tratamientos
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_tratamientos.clinica_id
    )
  );
