-- 0027_mascotas_codigo.sql
-- Codigo visible/personalizable de paciente por clinica.

ALTER TABLE public.mascotas
  ADD COLUMN IF NOT EXISTS codigo_text TEXT;

COMMENT ON COLUMN public.mascotas.codigo_text
  IS 'Codigo visible/personalizable del paciente usado por la clinica.';

CREATE UNIQUE INDEX IF NOT EXISTS mascotas_clinica_codigo_unique
  ON public.mascotas (clinica_id, codigo_text)
  WHERE codigo_text IS NOT NULL AND btrim(codigo_text) <> '';
