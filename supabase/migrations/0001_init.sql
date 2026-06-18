create extension if not exists "pgcrypto";

create table if not exists public.clinicas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_clinicas (
  user_id uuid not null,
  clinica_id uuid not null references public.clinicas (id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (user_id, clinica_id)
);

alter table public.clinicas enable row level security;
alter table public.user_clinicas enable row level security;

create policy "clinicas_select_for_members"
on public.clinicas
for select
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clinicas.id
  )
);

create policy "user_clinicas_select_own"
on public.user_clinicas
for select
to authenticated
using (user_id = auth.uid());

create policy "user_clinicas_insert_self"
on public.user_clinicas
for insert
to authenticated
with check (user_id = auth.uid());

create or replace function public.create_clinica(p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.clinicas (nombre, created_by)
  values (p_nombre, auth.uid())
  returning id into v_id;

  insert into public.user_clinicas (user_id, clinica_id, role)
  values (auth.uid(), v_id, 'owner');

  return v_id;
end;
$$;

grant execute on function public.create_clinica(text) to authenticated;

