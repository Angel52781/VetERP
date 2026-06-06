-- 0029_items_catalogo_fecha_vencimiento.sql
-- Agrega fecha de vencimiento opcional a productos para mostrar su estado directo
-- desde inventario y catalogo sin depender de movimientos/lotes.

alter table public.items_catalogo
  add column if not exists fecha_vencimiento date;

comment on column public.items_catalogo.fecha_vencimiento
  is 'Fecha de vencimiento opcional del producto. No reemplaza el vencimiento por lote en movimientos_stock.';

create index if not exists idx_items_catalogo_fecha_vencimiento
  on public.items_catalogo (clinica_id, fecha_vencimiento)
  where fecha_vencimiento is not null and kind = 'producto';
