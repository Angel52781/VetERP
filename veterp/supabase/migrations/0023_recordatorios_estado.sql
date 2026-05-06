-- Recordatorios v2 sobre seguimientos_clinicos.
-- Agrega estado operativo, metadatos de cierre y tipos generales.
-- Idempotente y no destructiva: no borra registros existentes.

ALTER TABLE public.seguimientos_clinicos
  ADD COLUMN IF NOT EXISTS estado_text TEXT,
  ADD COLUMN IF NOT EXISTS resuelto_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resuelto_por UUID,
  ADD COLUMN IF NOT EXISTS cancelado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelado_por UUID,
  ADD COLUMN IF NOT EXISTS resolucion_notas_text TEXT;

UPDATE public.seguimientos_clinicos
SET estado_text = 'pendiente'
WHERE estado_text IS NULL
   OR estado_text NOT IN ('pendiente', 'resuelto', 'cancelado');

ALTER TABLE public.seguimientos_clinicos
  ALTER COLUMN estado_text SET DEFAULT 'pendiente',
  ALTER COLUMN estado_text SET NOT NULL;

COMMENT ON COLUMN public.seguimientos_clinicos.estado_text IS
  'Estado operativo del recordatorio: pendiente, resuelto o cancelado.';
COMMENT ON COLUMN public.seguimientos_clinicos.resuelto_at IS
  'Fecha y hora en que el recordatorio fue marcado como resuelto.';
COMMENT ON COLUMN public.seguimientos_clinicos.resuelto_por IS
  'Usuario que marco el recordatorio como resuelto.';
COMMENT ON COLUMN public.seguimientos_clinicos.cancelado_at IS
  'Fecha y hora en que el recordatorio fue cancelado.';
COMMENT ON COLUMN public.seguimientos_clinicos.cancelado_por IS
  'Usuario que cancelo el recordatorio.';
COMMENT ON COLUMN public.seguimientos_clinicos.resolucion_notas_text IS
  'Notas opcionales al resolver o cancelar el recordatorio.';

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.seguimientos_clinicos'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%tipo_text%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.seguimientos_clinicos DROP CONSTRAINT IF EXISTS %I',
      constraint_name
    );
  END LOOP;
END $$;

ALTER TABLE public.seguimientos_clinicos
  ADD CONSTRAINT seguimientos_clinicos_tipo_text_check
  CHECK (
    tipo_text IN (
      'vacuna',
      'control',
      'llamar_responsable',
      'aplicar_dosis',
      'muestra_pendiente',
      'revision',
      'post_consulta',
      'administrativo',
      'laboratorio'
    )
  );

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.seguimientos_clinicos'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%estado_text%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.seguimientos_clinicos DROP CONSTRAINT IF EXISTS %I',
      constraint_name
    );
  END LOOP;
END $$;

ALTER TABLE public.seguimientos_clinicos
  ADD CONSTRAINT seguimientos_clinicos_estado_text_check
  CHECK (estado_text IN ('pendiente', 'resuelto', 'cancelado'));

CREATE INDEX IF NOT EXISTS idx_seguimientos_clinicos_estado_fecha
  ON public.seguimientos_clinicos(clinica_id, estado_text, proxima_fecha_date);
