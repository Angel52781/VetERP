-- ============================================================
-- Migración 0021: Área operativa para tipos de cita
-- Separa agenda clínica, baños, grooming, cirugía y movilidad.
-- Idempotente y no destructiva.
-- ============================================================

ALTER TABLE public.tipo_citas
  ADD COLUMN IF NOT EXISTS area TEXT NOT NULL DEFAULT 'clinica';

-- Reemplazar constraint si ya existía con valores antiguos
ALTER TABLE public.tipo_citas
  DROP CONSTRAINT IF EXISTS tipo_citas_area_check;

UPDATE public.tipo_citas
SET area = CASE
  WHEN lower(trim(nombre)) IN (
    'bano',
    'baño',
    'bano medicado',
    'baño medicado',
    'bano antipulgas',
    'baño antipulgas'
  ) THEN 'banos'

  WHEN lower(trim(nombre)) IN (
    'bano + corte',
    'baño + corte',
    'grooming'
  ) THEN 'grooming'

  WHEN lower(trim(nombre)) IN (
    'cirugia',
    'cirugía',
    'esterilizacion',
    'esterilización',
    'cirugia traumatologica',
    'cirugía traumatológica',
    'cirugia general',
    'cirugía general'
  ) THEN 'cirugia'

  WHEN lower(trim(nombre)) = 'movilidad' THEN 'movilidad'
  WHEN lower(trim(nombre)) = 'otro' THEN 'otro'
  ELSE 'clinica'
END;

ALTER TABLE public.tipo_citas
  ALTER COLUMN area SET DEFAULT 'clinica',
  ALTER COLUMN area SET NOT NULL;

ALTER TABLE public.tipo_citas
  ADD CONSTRAINT tipo_citas_area_check
  CHECK (area IN ('clinica', 'banos', 'grooming', 'cirugia', 'movilidad', 'otro'));

INSERT INTO public.tipo_citas (clinica_id, nombre, duracion_min, color, area)
SELECT
  c.id,
  v.nombre,
  v.duracion_min,
  v.color,
  'cirugia'
FROM public.clinicas c
CROSS JOIN (
  VALUES
    ('Cirugía', 120, '#DC2626', ARRAY['cirugia', 'cirugía']),
    ('Esterilización', 120, '#B91C1C', ARRAY['esterilizacion', 'esterilización']),
    ('Cirugía traumatológica', 180, '#991B1B', ARRAY['cirugia traumatologica', 'cirugía traumatológica']),
    ('Cirugía general', 120, '#EF4444', ARRAY['cirugia general', 'cirugía general'])
) AS v(nombre, duracion_min, color, aliases)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tipo_citas tc
  WHERE tc.clinica_id = c.id
    AND lower(trim(tc.nombre)) = ANY(v.aliases)
);

CREATE INDEX IF NOT EXISTS idx_tipo_citas_clinica_area
  ON public.tipo_citas(clinica_id, area);
