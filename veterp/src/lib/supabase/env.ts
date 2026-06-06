export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const clinicaCookieName =
  process.env.VETERP_CLINICA_COOKIE ?? "veterp_clinica_id";

export function assertSupabaseEnv() {
  if (!supabaseUrl || supabaseUrl === "https://xfvytozrdakufeebrewi.supabase.co") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL no está configurada. Por favor, añade tu URL de Supabase en el archivo .env.local",
    );
  }
  if (!supabaseAnonKey || supabaseAnonKey === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmdnl0b3pyZGFrdWZlZWJyZXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MjY0OTQsImV4cCI6MjA5MjMwMjQ5NH0.4NvtHc9SMF_Xvuy7dY-9ZF3QD6UTVGfAH4YkoqzXnwo") {
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
