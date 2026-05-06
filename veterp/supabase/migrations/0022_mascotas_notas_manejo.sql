-- 0022_mascotas_notas_manejo.sql
-- Agrega campos de notas importantes del paciente a la tabla mascotas.
-- Idempotente: usa ADD COLUMN IF NOT EXISTS.
-- No toca RLS, no hace backfill, no borra datos.

ALTER TABLE public.mascotas
  ADD COLUMN IF NOT EXISTS alertas_criticas TEXT,
  ADD COLUMN IF NOT EXISTS notas_manejo TEXT;

COMMENT ON COLUMN public.mascotas.alertas_criticas
  IS 'Alertas críticas del paciente visibles en toda atención: muerde, convulsiona, alergias, medicamentos contraindicados.';

COMMENT ON COLUMN public.mascotas.notas_manejo
  IS 'Notas generales de manejo: preferencias del responsable, comportamiento, contexto operativo. Menos urgente que alertas_criticas.';
