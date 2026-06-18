-- Herramientas mínimas para diagnóstico/recuperación de cache de esquema en PostgREST.
-- Permiten verificar existencia física de tabla y solicitar recarga de cache.

CREATE OR REPLACE FUNCTION public.table_exists(p_schema TEXT, p_table TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT to_regclass(format('%I.%I', p_schema, p_table)) IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.table_exists(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.table_exists(TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reload_postgrest_schema_cache()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_notify('pgrst', 'reload schema');
$$;

REVOKE ALL ON FUNCTION public.reload_postgrest_schema_cache() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reload_postgrest_schema_cache() TO authenticated, service_role;
