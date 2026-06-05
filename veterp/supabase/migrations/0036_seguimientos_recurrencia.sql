-- 0036_seguimientos_recurrencia.sql
ALTER TABLE public.seguimientos_clinicos
  ADD COLUMN IF NOT EXISTS recurrencia_unidad_text TEXT CHECK (recurrencia_unidad_text IN ('dias', 'semanas', 'meses', 'anios')),
  ADD COLUMN IF NOT EXISTS recurrencia_cada_int INT CHECK (recurrencia_cada_int > 0),
  ADD COLUMN IF NOT EXISTS recordatorio_previo_id UUID REFERENCES public.seguimientos_clinicos(id) ON DELETE SET NULL;

ALTER TABLE public.seguimientos_clinicos
  ADD CONSTRAINT seguimientos_clinicos_recurrencia_check 
  CHECK (
    (recurrencia_unidad_text IS NULL AND recurrencia_cada_int IS NULL) OR
    (recurrencia_unidad_text IS NOT NULL AND recurrencia_cada_int IS NOT NULL)
  );

COMMENT ON COLUMN public.seguimientos_clinicos.recurrencia_unidad_text IS 'Unidad de tiempo de recurrencia: dias, semanas, meses, anios';
COMMENT ON COLUMN public.seguimientos_clinicos.recurrencia_cada_int IS 'Cantidad de unidades de tiempo para la recurrencia';
COMMENT ON COLUMN public.seguimientos_clinicos.recordatorio_previo_id IS 'ID del recordatorio previo en la cadena de recurrencia';
