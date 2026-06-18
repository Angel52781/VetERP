-- 0040_registros_previos.sql
-- Implementación de HC-1D: Registro Previo / Historia clínica antigua

create table if not exists public.registros_previos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  mascota_id uuid not null references public.mascotas(id) on delete cascade,
  
  fecha_historica_date date not null check (fecha_historica_date <= current_date),
  fecha_aproximada_bool boolean not null default false,
  
  titulo_text text not null check (trim(titulo_text) <> ''),
  descripcion_text text not null check (trim(descripcion_text) <> ''),
  fuente_text text null,
  tipo_text text not null default 'antecedente_clinico',
  
  creado_por uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  anulado_at timestamptz null,
  anulado_por uuid null references auth.users(id) on delete set null,
  motivo_anulacion_text text null,

  constraint registros_previos_anulacion_check check (
    (anulado_at is null and anulado_por is null and motivo_anulacion_text is null) or
    (anulado_at is not null and anulado_por is not null and trim(motivo_anulacion_text) <> '')
  )
);

-- Índices de consulta rápida
create index if not exists registros_previos_clinica_mascota_fecha_idx 
  on public.registros_previos (clinica_id, mascota_id, fecha_historica_date desc);

create index if not exists registros_previos_clinica_anulados_idx 
  on public.registros_previos (clinica_id, anulado_at)
  where anulado_at is not null;

-- Trigger updated_at
drop trigger if exists registros_previos_set_updated_at on public.registros_previos;
create trigger registros_previos_set_updated_at
  before update on public.registros_previos
  for each row
  execute procedure public.set_updated_at();

-- Habilitar RLS
alter table public.registros_previos enable row level security;

-- Políticas de RLS

-- SELECT: Disponible para todo miembro de la clínica (staff, owner, admin, veterinario)
drop policy if exists "registros_previos_select_for_members" on public.registros_previos;
create policy "registros_previos_select_for_members"
  on public.registros_previos
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = registros_previos.clinica_id
    )
  );

-- INSERT: Limitado a personal clínico y administrativo
drop policy if exists "registros_previos_insert_for_authorized" on public.registros_previos;
create policy "registros_previos_insert_for_authorized"
  on public.registros_previos
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_clinicas uc
      where uc.user_id = auth.uid()
        and uc.clinica_id = registros_previos.clinica_id
        and lower(trim(uc.role)) in ('owner', 'admin', 'veterinario')
    )
    and exists (
      select 1 from public.mascotas m
      where m.id = registros_previos.mascota_id
        and m.clinica_id = registros_previos.clinica_id
    )
  );

-- UPDATE: No se define política de update público para evitar que se editen 
-- fechas históricas o diagnósticos en texto libre de forma incontrolada.
-- La anulación se realizará en un bloque futuro mediante una función RPC SECURITY DEFINER
-- que actualice estrictamente los campos 'anulado_at', 'anulado_por' y 'motivo',
-- garantizando la integridad de los demás datos y eliminando la necesidad
-- de abrir la tabla al comando UPDATE.

-- DELETE: Omitido intencionalmente (no hard delete permitido)
