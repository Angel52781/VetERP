ALTER TABLE public.ledger
ADD COLUMN IF NOT EXISTS notas_text TEXT;

COMMENT ON COLUMN public.ledger.notas_text IS
  'Referencia operativa para pagos, anticipos o abonos libres del cliente.';
