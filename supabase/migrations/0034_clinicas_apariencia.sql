alter table public.clinicas
  add column theme_preset_text text not null default 'default',
  add column brand_color_text text null;

alter table public.clinicas
  add constraint clinicas_theme_preset_text_check
  check (theme_preset_text in ('default', 'blue', 'green', 'purple', 'warm', 'high_contrast'));

alter table public.clinicas
  add constraint clinicas_brand_color_text_check
  check (brand_color_text is null or brand_color_text ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.clinicas.theme_preset_text is
  'Preset visual aplicado a la UI de la clinica.';

comment on column public.clinicas.brand_color_text is
  'Color principal opcional de la clinica en formato hexadecimal #RRGGBB.';
