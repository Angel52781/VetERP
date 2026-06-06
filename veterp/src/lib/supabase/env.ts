export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const clinicaCookieName =
  process.env.VETERP_CLINICA_COOKIE ?? "veterp_clinica_id";

export function assertSupabaseEnv() {
  if (!supabaseUrl || supabaseUrl === "tu_supabase_url") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL no está configurada. Por favor, añade tu URL de Supabase en el archivo .env.local",
    );
  }
  if (!supabaseAnonKey || supabaseAnonKey === "tu_supabase_anon_key") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada. Por favor, añade tu anon key de Supabase en el archivo .env.local",
    );
  }

  try {
    new URL(supabaseUrl);
  } catch (err) {
    throw new Error(
      `La URL de Supabase '${supabaseUrl}' no es válida. Debe ser una URL completa (ej: https://xyz.supabase.co)`,
    );
  }
}
