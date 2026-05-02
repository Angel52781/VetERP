-- ============================================================
-- Migración 0020: Grooming, Baño, Movilidad
-- Tipos de cita y servicios base para beta.
-- Idempotente: solo inserta si no existe, nunca borra datos.
-- Compatible con todas las clínicas existentes.
-- ============================================================

-- FASE 1: Tipos de cita para todas las clínicas

INSERT INTO public.tipo_citas (clinica_id, nombre, duracion_min, color)
SELECT
  c.id,
  v.nombre,
  v.duracion_min,
  v.color
FROM public.clinicas c
CROSS JOIN (
  VALUES
    ('Consulta general', 30, '#3B82F6'),
    ('Vacunación', 20, '#10B981'),
    ('Control', 20, '#8B5CF6'),
    ('Emergencia', 45, '#EF4444'),
    ('Baño', 60, '#06B6D4'),
    ('Baño medicado', 60, '#0891B2'),
    ('Baño antipulgas', 60, '#0E7490'),
    ('Baño + corte', 120, '#7C3AED'),
    ('Grooming', 120, '#6D28D9'),
    ('Corte de uñas', 20, '#D97706'),
    ('Desparasitación', 20, '#059669'),
    ('Movilidad', 30, '#F59E0B'),
    ('Otro', 30, '#6B7280')
) AS v(nombre, duracion_min, color)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tipo_citas tc
  WHERE tc.clinica_id = c.id
    AND lower(trim(tc.nombre)) = lower(trim(v.nombre))
);

-- FASE 2: Categorías de catálogo para todas las clínicas

INSERT INTO public.categorias_catalogo (clinica_id, nombre, descripcion)
SELECT
  c.id,
  v.nombre,
  v.descripcion
FROM public.clinicas c
CROSS JOIN (
  VALUES
    ('Consultas', 'Servicios de consulta y diagnóstico'),
    ('Vacunas', 'Vacunas y biológicos'),
    ('Baños / Grooming', 'Servicios de estética y grooming'),
    ('Movilidad', 'Servicio de recojo y traslado de mascotas'),
    ('Adicionales', 'Servicios adicionales opcionales'),
    ('Promociones / Combos', 'Paquetes y promociones especiales'),
    ('Otros servicios', 'Otros servicios no clasificados')
) AS v(nombre, descripcion)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categorias_catalogo cc
  WHERE cc.clinica_id = c.id
    AND lower(trim(cc.nombre)) = lower(trim(v.nombre))
);

-- FASE 3: Servicios base de catálogo para todas las clínicas

WITH servicios(nombre, precio, categoria_nombre) AS (
  VALUES
    ('Baño normal', 35, 'Baños / Grooming'),
    ('Baño medicado', 50, 'Baños / Grooming'),
    ('Baño antipulgas', 50, 'Baños / Grooming'),
    ('Baño + corte', 60, 'Baños / Grooming'),
    ('Grooming', 80, 'Baños / Grooming'),
    ('Corte de uñas', 15, 'Adicionales'),
    ('Desparasitación', 20, 'Consultas'),
    ('Movilidad', 12, 'Movilidad'),
    ('Limpieza de oídos', 10, 'Adicionales'),
    ('Limpieza de glándulas perianales', 15, 'Adicionales'),
    ('Deslanado / cepillado', 10, 'Adicionales'),
    ('Desmotado', 10, 'Adicionales'),
    ('Champú medicado', 10, 'Adicionales'),
    ('Champú antipulgas', 10, 'Adicionales'),
    ('Combo baño + corte', 70, 'Promociones / Combos'),
    ('Combo baño + grooming', 90, 'Promociones / Combos'),
    ('Promoción baño básico', 30, 'Promociones / Combos'),
    ('Promoción grooming', 75, 'Promociones / Combos')
)
INSERT INTO public.items_catalogo (
  clinica_id,
  nombre,
  kind,
  precio_inc,
  categoria_id,
  is_disabled
)
SELECT
  c.id,
  s.nombre,
  'servicio',
  s.precio,
  cc.id,
  false
FROM public.clinicas c
CROSS JOIN servicios s
LEFT JOIN public.categorias_catalogo cc
  ON cc.clinica_id = c.id
 AND lower(trim(cc.nombre)) = lower(trim(s.categoria_nombre))
WHERE NOT EXISTS (
  SELECT 1
  FROM public.items_catalogo ic
  WHERE ic.clinica_id = c.id
    AND ic.kind = 'servicio'
    AND lower(trim(ic.nombre)) = lower(trim(s.nombre))
);