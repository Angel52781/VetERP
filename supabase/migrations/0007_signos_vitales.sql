-- Migración aditiva: agrega campos clínicos estructurados a entradas_clinicas
-- Todas las columnas son nullable → compatibilidad total con registros existentes

ALTER TABLE public.entradas_clinicas
  ADD COLUMN IF NOT EXISTS motivo_consulta_text TEXT,
  ADD COLUMN IF NOT EXISTS peso_kg_num         NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS temperatura_c_num   NUMERIC(4, 1),
  ADD COLUMN IF NOT EXISTS frecuencia_cardiaca_num  INTEGER,
  ADD COLUMN IF NOT EXISTS frecuencia_respiratoria_num INTEGER,
  ADD COLUMN IF NOT EXISTS observaciones_text  TEXT,
  ADD COLUMN IF NOT EXISTS diagnostico_text    TEXT;

-- Índice para búsqueda de entradas con diagnóstico (opcional, seguro)
CREATE INDEX IF NOT EXISTS idx_entradas_clinicas_diagnostico
  ON public.entradas_clinicas (orden_id)
  WHERE diagnostico_text IS NOT NULL;

COMMENT ON COLUMN public.entradas_clinicas.motivo_consulta_text     IS 'Motivo principal de la consulta';
COMMENT ON COLUMN public.entradas_clinicas.peso_kg_num              IS 'Peso del paciente en kilogramos';
COMMENT ON COLUMN public.entradas_clinicas.temperatura_c_num        IS 'Temperatura corporal en grados Celsius';
COMMENT ON COLUMN public.entradas_clinicas.frecuencia_cardiaca_num  IS 'Frecuencia cardíaca en latidos por minuto';
COMMENT ON COLUMN public.entradas_clinicas.frecuencia_respiratoria_num IS 'Frecuencia respiratoria en respiraciones por minuto';
COMMENT ON COLUMN public.entradas_clinicas.observaciones_text       IS 'Observaciones clínicas generales del examen físico';
COMMENT ON COLUMN public.entradas_clinicas.diagnostico_text         IS 'Diagnóstico o impresión clínica inicial';
