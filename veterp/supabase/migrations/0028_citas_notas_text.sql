-- 0028_citas_notas_text.sql
-- Notas operativas por cita, visibles para agenda, grooming y ficha del paciente.

ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS notas_text TEXT;

COMMENT ON COLUMN public.citas.notas_text
  IS 'Notas operativas de la cita: manejo, cuidados, movilidad/direccion u observaciones visibles para agenda y grooming.';
