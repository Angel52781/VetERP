alter table public.clientes
  add column if not exists tipo_documento_text text null,
  add column if not exists numero_documento_text text null,
  add column if not exists direccion_principal_text text null,
  add column if not exists referencia_direccion_text text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_tipo_documento_check'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_tipo_documento_check
      check (
        nullif(btrim(coalesce(tipo_documento_text, '')), '') is null
        or lower(btrim(tipo_documento_text)) in ('dni', 'ce', 'pasaporte', 'ruc', 'otro')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_documento_completo_check'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_documento_completo_check
      check (
        (
          nullif(btrim(coalesce(tipo_documento_text, '')), '') is null
          and nullif(btrim(coalesce(numero_documento_text, '')), '') is null
        )
        or
        (
          nullif(btrim(coalesce(tipo_documento_text, '')), '') is not null
          and nullif(btrim(coalesce(numero_documento_text, '')), '') is not null
        )
      );
  end if;
end $$;

create unique index if not exists clientes_clinica_documento_unique
on public.clientes (
  clinica_id,
  lower(btrim(tipo_documento_text)),
  lower(regexp_replace(btrim(numero_documento_text), '\s+', '', 'g'))
)
where nullif(btrim(tipo_documento_text), '') is not null
  and nullif(btrim(numero_documento_text), '') is not null;

comment on column public.clientes.tipo_documento_text is
  'Tipo de documento del responsable: dni, ce, pasaporte, ruc u otro.';

comment on column public.clientes.numero_documento_text is
  'Numero de documento del responsable, unico por clinica cuando se registra junto con tipo.';

comment on column public.clientes.direccion_principal_text is
  'Direccion principal del responsable para contacto operativo y futura movilidad.';

comment on column public.clientes.referencia_direccion_text is
  'Referencia opcional de direccion del responsable.';
