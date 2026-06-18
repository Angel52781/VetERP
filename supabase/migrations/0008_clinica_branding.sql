-- Añadir campos de branding a la tabla clinicas
alter table public.clinicas add column if not exists razon_social text;
alter table public.clinicas add column if not exists ruc text;
alter table public.clinicas add column if not exists telefono text;
alter table public.clinicas add column if not exists email text;
alter table public.clinicas add column if not exists direccion text;
alter table public.clinicas add column if not exists logo_url text;

-- Política para permitir actualización de clínica a miembros con rol owner o admin
create policy "clinicas_update_for_admins"
on public.clinicas
for update
to authenticated
using (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clinicas.id
      and uc.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.user_clinicas uc
    where uc.user_id = auth.uid()
      and uc.clinica_id = clinicas.id
      and uc.role in ('owner', 'admin')
  )
);

-- Crear bucket de storage para branding (logos)
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Políticas de storage para branding
create policy "Branding es publico"
on storage.objects for select
using ( bucket_id = 'branding' );

create policy "Admins pueden subir logos"
on storage.objects for insert
with check (
  bucket_id = 'branding' AND
  exists (
    select 1 from public.user_clinicas uc
    where uc.user_id = auth.uid() 
      and uc.clinica_id::text = (string_to_array(name, '/'))[1]
      and uc.role in ('owner', 'admin')
  )
);

create policy "Admins pueden borrar logos"
on storage.objects for delete
using (
  bucket_id = 'branding' AND
  exists (
    select 1 from public.user_clinicas uc
    where uc.user_id = auth.uid() 
      and uc.clinica_id::text = (string_to_array(name, '/'))[1]
      and uc.role in ('owner', 'admin')
  )
);
