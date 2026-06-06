import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";

export type StaffDirectoryEntry = {
  userId: string;
  role: string | null;
  email: string | null;
};

export async function getClinicaStaffDirectory(userIds?: string[]) {
  const clinicaId = await requireClinicaIdFromCookies();
  const supabase = await createClient();

  const normalizedUserIds = Array.from(new Set((userIds ?? []).filter(Boolean)));
  const { data, error } = await supabase.rpc("get_clinica_staff_directory", {
    p_clinica_id: clinicaId,
    p_user_ids: normalizedUserIds.length > 0 ? normalizedUserIds : null,
  });

  if (error) {
    return { error: error.message, data: [] as StaffDirectoryEntry[] };
  }

  const rows = Array.isArray(data) ? data : [];
  return {
    error: null,
    data: rows.map((row) => ({
      userId: String(row.user_id),
      role: typeof row.role === "string" ? row.role : null,
      email: typeof row.email === "string" ? row.email : null,
    })),
  };
}
