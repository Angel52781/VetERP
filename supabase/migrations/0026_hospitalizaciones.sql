-- 0026_hospitalizaciones.sql
-- MVP de hospitalizaciones: internamientos activos, controles basicos y alta.
-- No crea facturacion, medicacion compleja ni movimientos de inventario.

create table if not exists public.hospitalizaciones (
  id                              uuid        primary key default gen_random_uuid(),
  clinica_id                      uuid        not null references public.clinicas(id) on delete cascade,
  mascota_id                      uuid        not null references public.mascotas(id) on delete cascade,
  cliente_id                      uuid        not null references public.clientes(id) on delete cascade,
  medico_tratante_text            text        null,
  motivo_text                     text        null,
  diagnostico_presuntivo_text     text        null,
  estado_text                     text        not null default 'activa'
                                      check (estado_text in ('activa', 'alta', 'cancelada')),
  internado_at                    timestamptz not null default now(),
  alta_at                         timestamptz null,
  alta_notas_text                 text        null,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create table if not exists public.hospitalizacion_controles (
  id                            uuid        primary key default gen_random_uuid(),
  clinica_id                    uuid        not null references public.clinicas(id) on delete cascade,
  hospitalizacion_id            uuid        not null references public.hospitalizaciones(id) on delete cascade,
  mascota_id                    uuid        not null references public.mascotas(id) on delete cascade,
  temperatura_num               numeric     null,
  frecuencia_cardiaca_num       numeric     null,
  frecuencia_respiratoria_num   numeric     null,
  peso_num                      numeric     null,
  deshidratacion_pct            numeric     null,
  mucosas_text                  text        null,
  tlc_text                      text        null,
  comio_bool                    boolean     null,
  orino_bool                    boolean     null,
  defeco_bool                   boolean     null,
  observaciones_text            text        null,
  registrado_at                 timestamptz not null default now(),
  created_at                    timestamptz not null default now()
);

comment on table public.hospitalizaciones
  is 'Internamientos de pacientes por clinica. H1 cubre estado activo, controles basicos y alta.';

comment on table public.hospitalizacion_controles
  is 'Controles basicos de evolucion durante una hospitalizacion. No modela medicacion ni facturacion.';

comment on column public.hospitalizaciones.estado_text
  is 'Estado operativo del internamiento: activa, alta o cancelada.';

comment on column public.hospitalizaciones.alta_notas_text
  is 'Notas libres del alta medica u operativa del internamiento.';

comment on column public.hospitalizacion_controles.deshidratacion_pct
  is 'Porcentaje estimado de deshidratacion, de 0 a 100.';

create index if not exists hospitalizaciones_clinica_estado_internado_idx
  on public.hospitalizaciones (clinica_id, estado_text, internado_at desc);

create index if not exists hospitalizaciones_clinica_mascota_internado_idx
  on public.hospitalizaciones (clinica_id, mascota_id, internado_at desc);

create index if not exists hospitalizacion_controles_clinica_hosp_registrado_idx
  on public.hospitalizacion_controles (clinica_id, hospitalizacion_id, registrado_at desc);

create index if not exists hospitalizacion_controles_clinica_mascota_registrado_idx
  on public.hospitalizacion_controles (clinica_id, mascota_id, registrado_at desc);

drop trigger if exists hospitalizaciones_set_updated_at on public.hospitalizaciones;
create trigger hospitalizaciones_set_updated_at
  before update on public.hospitalizaciones
  for each row
  execute procedure public.set_updated_at();

alter table public.hospitalizaciones enable row level security;
alter table public.hospitalizacion_controles enable row level security;

drop policy if exists "hospitalizaciones_select_for_members" on public.hospitalizaciones;
create policy "hospitalizaciones_select_for_members"
  on public.hospitalizaciones
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizaciones.clinica_id
    )
  );

drop policy if exists "hospitalizaciones_insert_for_members" on public.hospitalizaciones;
create policy "hospitalizaciones_insert_for_members"
  on public.hospitalizaciones
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizaciones.clinica_id
    )
  );

drop policy if exists "hospitalizaciones_update_for_members" on public.hospitalizaciones;
create policy "hospitalizaciones_update_for_members"
  on public.hospitalizaciones
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizaciones.clinica_id
    )
  )
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizaciones.clinica_id
    )
  );

drop policy if exists "hospitalizaciones_delete_for_members" on public.hospitalizaciones;
create policy "hospitalizaciones_delete_for_members"
  on public.hospitalizaciones
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizaciones.clinica_id
    )
  );

drop policy if exists "hospitalizacion_controles_select_for_members" on public.hospitalizacion_controles;
create policy "hospitalizacion_controles_select_for_members"
  on public.hospitalizacion_controles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_controles.clinica_id
    )
  );

drop policy if exists "hospitalizacion_controles_insert_for_members" on public.hospitalizacion_controles;
create policy "hospitalizacion_controles_insert_for_members"
  on public.hospitalizacion_controles
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_controles.clinica_id
    )
    and exists (
      select 1 from public.hospitalizaciones h
      where h.id = hospitalizacion_controles.hospitalizacion_id
        and h.clinica_id = hospitalizacion_controles.clinica_id
    )
  );

drop policy if exists "hospitalizacion_controles_update_for_members" on public.hospitalizacion_controles;
create policy "hospitalizacion_controles_update_for_members"
  on public.hospitalizacion_controles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_controles.clinica_id
    )
  )
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_controles.clinica_id
    )
    and exists (
      select 1 from public.hospitalizaciones h
      where h.id = hospitalizacion_controles.hospitalizacion_id
        and h.clinica_id = hospitalizacion_controles.clinica_id
    )
  );

drop policy if exists "hospitalizacion_controles_delete_for_members" on public.hospitalizacion_controles;
create policy "hospitalizacion_controles_delete_for_members"
  on public.hospitalizacion_controles
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = hospitalizacion_controles.clinica_id
    )
  );
