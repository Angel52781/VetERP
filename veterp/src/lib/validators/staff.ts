import { z } from "zod";

export const roles = ["owner", "admin", "veterinario", "asistente"] as const;
export type StaffRole = (typeof roles)[number];

export const invitationSchema = z.object({
  email: z.string().email("Debe ser un correo electronico valido"),
  role: z.enum(roles, {
    message: "Rol invalido seleccionado",
  }),
});

export type InvitationInput = z.infer<typeof invitationSchema>;

export const updateRoleSchema = z.object({
  userId: z.string().trim().uuid("ID de usuario invalido"),
  role: z.enum(roles, {
    message: "Rol invalido seleccionado",
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const staffMemberRowSchema = z.object({
  user_id: z.string().trim().uuid("ID de usuario invalido"),
  role: z.enum(roles, {
    message: "Rol invalido seleccionado",
  }),
  email: z.string().trim().nullish(),
  created_at: z.string(),
});

export const staffMemberSchema = staffMemberRowSchema.transform(({ user_id, created_at, email, ...rest }) => ({
  ...rest,
  email: email?.trim() || "(sin correo)",
  userId: user_id,
  createdAt: created_at,
}));

export type StaffMember = z.infer<typeof staffMemberSchema>;
