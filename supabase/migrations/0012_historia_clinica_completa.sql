-- Migración aditiva: completa el esquema SOAP en entradas_clinicas
-- Agrega campos para Anamnesis (Historia Actual) y Plan de Tratamiento

ALTER TABLE public.entradas_clinicas
  ADD COLUMN IF NOT EXISTS anamnesis_text TEXT,
  ADD COLUMN IF NOT EXISTS plan_tratamiento_text TEXT;

COMMENT ON COLUMN public.entradas_clinicas.anamnesis_text        IS 'Historia actual, dieta, entorno y descripción subjetiva del tutor';
COMMENT ON COLUMN public.entradas_clinicas.plan_tratamiento_text IS 'Plan terapéutico, recomendaciones y próximos pasos';
