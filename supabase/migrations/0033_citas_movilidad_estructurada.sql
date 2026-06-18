alter table public.citas
  add column if not exists movilidad_usa_direccion_cliente boolean not null default false,
  add column if not exists movilidad_direccion_text text null,
  add column if not exists movilidad_referencia_text text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'citas_movilidad_direccion_len_check'
      and conrelid = 'public.citas'::regclass
  ) then
    alter table public.citas
      add constraint citas_movilidad_direccion_len_check
      check (
        movilidad_direccion_text is null
        or char_length(btrim(movilidad_direccion_text)) <= 300
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'citas_movilidad_referencia_len_check'
      and conrelid = 'public.citas'::regclass
  ) then
    alter table public.citas
      add constraint citas_movilidad_referencia_len_check
      check (
        movilidad_referencia_text is null
        or char_length(btrim(movilidad_referencia_text)) <= 300
      );
  end if;
end $$;

comment on column public.citas.movilidad_usa_direccion_cliente is
  'Indica si la direccion de movilidad fue tomada desde la direccion principal del responsable.';

comment on column public.citas.movilidad_direccion_text is
  'Direccion snapshot usada para movilidad de la cita.';

comment on column public.citas.movilidad_referencia_text is
  'Referencia o indicaciones de traslado para movilidad de la cita.';

create index if not exists idx_citas_clinica_movilidad
  on public.citas (clinica_id, start_date)
  where movilidad_usa_direccion_cliente = true
     or movilidad_direccion_text is not null;
