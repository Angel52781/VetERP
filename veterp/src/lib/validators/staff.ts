import { z } from "zod";

export const roles = ["owner", "admin", "veterinario", "asistente"] as const;
export type StaffRole = (typeof roles)[number];

const normalizedRoleSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z.enum(roles, {
      message: "Rol invalido seleccionado",
    }),
  );

export const invitationSchema = z.object({
  email: z.string().email("Debe ser un correo electronico valido"),
  role: normalizedRoleSchema,
});

export type InvitationInput = z.infer<typeof invitationSchema>;

export const updateRoleSchema = z.object({
  userId: z.string().trim().uuid("ID de usuario invalido"),
  role: normalizedRoleSchema,
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const updateNameSchema = z.object({
  userId: z.string().trim().uuid("ID de usuario invalido"),
  nombreVisible: z.string().trim().max(100, "Nombre demasiado largo").nullable(),
});

export type UpdateNameInput = z.infer<typeof updateNameSchema>;

export const staffMemberRowSchema = z.object({
  user_id: z.string().trim().uuid("ID de usuario invalido"),
  role: normalizedRoleSchema,
  email: z.string().trim().nullish(),
  created_at: z.string(),
  nombre_visible_text: z.string().trim().nullish(),
});

export const staffMemberSchema = staffMemberRowSchema.transform(({ user_id, created_at, email, nombre_visible_text, ...rest }) => ({
  ...rest,
  email: email?.trim() || "(sin correo)",
  nombreVisible: nombre_visible_text?.trim() || null,
  userId: user_id,
  createdAt: created_at,
}));

export type StaffMember = z.infer<typeof staffMemberSchema>;
