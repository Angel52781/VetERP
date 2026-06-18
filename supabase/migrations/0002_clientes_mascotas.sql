create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete cascade,
  nombre text not null,
  telefono text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mascotas (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nombre text not null,
  especie text,
  raza text,
  nacimiento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
before update on public.clientes
for each row
execute procedure public.set_updated_at();

drop trigger if exists mascotas_set_updated_at on public.mascotas;
create trigger mascotas_set_updated_at
before update on public.mascotas
for each row
execute procedure public.set_updated_at();

alter table public.clientes enable row level security;
alter table public.mascotas enable row level security;

create policy "clientes_select_for_members"
on public.clientes
for select
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clientes.clinica_id
  )
);

create policy "clientes_insert_for_members"
on public.clientes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clinica_id
  )
);

create policy "clientes_update_for_members"
on public.clientes
for update
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clientes.clinica_id
  )
)
with check (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clinica_id
  )
);

create policy "clientes_delete_for_members"
on public.clientes
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clientes.clinica_id
  )
);

create policy "mascotas_select_for_members"
on public.mascotas
for select
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = mascotas.clinica_id
  )
);

create policy "mascotas_insert_for_members"
on public.mascotas
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clinica_id
  )
);

create policy "mascotas_update_for_members"
on public.mascotas
for update
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = mascotas.clinica_id
  )
)
with check (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clinica_id
  )
);

create policy "mascotas_delete_for_members"
on public.mascotas
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = mascotas.clinica_id
  )
);

create index if not exists clientes_clinica_id_idx on public.clientes (clinica_id);
create index if not exists mascotas_cliente_id_idx on public.mascotas (cliente_id);
create index if not exists mascotas_clinica_id_idx on public.mascotas (clinica_id);

