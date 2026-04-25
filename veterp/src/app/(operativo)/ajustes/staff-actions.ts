"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUserRole } from "@/lib/clinica";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { invitationSchema, InvitationInput, staffMemberSchema, updateRoleSchema, UpdateRoleInput } from "@/lib/validators/staff";

const staffListSchema = z.array(staffMemberSchema);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error inesperado.";
}

export async function getStaff() {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_clinica_staff", {
      p_clinica_id: clinicaId,
    });

    if (error) throw error;

    const parsed = staffListSchema.safeParse(data || []);
    if (!parsed.success) {
      return { error: "No se pudo normalizar el listado de staff.", data: [] };
    }

    return { error: null, data: parsed.data };
  } catch (error: unknown) {
    return { error: getErrorMessage(error), data: [] };
  }
}

export async function getInvitations() {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clinica_invitations")
      .select("*")
      .eq("clinica_id", clinicaId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { error: null, data: data || [] };
  } catch (error: unknown) {
    return { error: getErrorMessage(error), data: [] };
  }
}

export async function createInvitation(input: InvitationInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const validated = invitationSchema.parse(input);

    // Ensure it's not already a member
    const { data: staffMembers } = await supabase.rpc("get_clinica_staff", {
      p_clinica_id: clinicaId,
    });

    const staffEmails = Array.isArray(staffMembers)
      ? staffMembers.flatMap((staffMember) => {
          if (
            typeof staffMember === "object" &&
            staffMember !== null &&
            "email" in staffMember &&
            typeof staffMember.email === "string"
          ) {
            return [staffMember.email.toLowerCase()];
          }

          return [];
        })
      : [];

    const isAlreadyMember = staffEmails.includes(validated.email.toLowerCase());
    if (isAlreadyMember) {
      return { error: "El usuario ya es miembro de la clínica." };
    }

    const { data, error } = await supabase
      .from("clinica_invitations")
      .insert({
        clinica_id: clinicaId,
        email: validated.email.toLowerCase(),
        role: validated.role,
        invited_by: user?.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") { // unique violation
        return { error: "Ya existe una invitación pendiente para este correo." };
      }
      throw error;
    }

    revalidatePath("/(operativo)/ajustes", "layout");
    return { error: null, data };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function revokeInvitation(invitationId: string) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();

    const { error } = await supabase
      .from("clinica_invitations")
      .update({ status: "revoked" })
      .eq("id", invitationId)
      .eq("clinica_id", clinicaId)
      .eq("status", "pending");

    if (error) throw error;

    revalidatePath("/(operativo)/ajustes", "layout");
    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateStaffRole(input: UpdateRoleInput) {
  try {
    const { clinicaId, role: currentUserRole } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const validated = updateRoleSchema.parse({
      ...input,
      userId: input.userId.trim(),
    });

    if (validated.userId === user?.id) {
      return { error: "No puedes cambiar tu propio rol." };
    }

    // Get current target user role
    const { data: targetMembership } = await supabase
      .from("user_clinicas")
      .select("role")
      .eq("user_id", validated.userId)
      .eq("clinica_id", clinicaId)
      .single();

    if (!targetMembership) {
      return { error: "Usuario no encontrado en la clínica." };
    }

    // Admin cannot change owner's role
    if (currentUserRole === "admin" && targetMembership.role === "owner") {
      return { error: "No tienes permiso para cambiar el rol de un Owner." };
    }

    // Admin cannot make someone else an owner
    if (currentUserRole === "admin" && validated.role === "owner") {
      return { error: "Solo los Owners pueden asignar el rol de Owner." };
    }

    const { error } = await supabase
      .from("user_clinicas")
      .update({ role: validated.role })
      .eq("user_id", validated.userId)
      .eq("clinica_id", clinicaId);

    if (error) throw error;

    revalidatePath("/(operativo)/ajustes", "layout");
    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function removeStaff(userId: string) {
  try {
    const { clinicaId, role: currentUserRole } = await requireUserRole(["owner", "admin"]);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (userId === user?.id) {
      return { error: "No puedes expulsarte a ti mismo." };
    }

    // Get current target user role
    const { data: targetMembership } = await supabase
      .from("user_clinicas")
      .select("role")
      .eq("user_id", userId)
      .eq("clinica_id", clinicaId)
      .single();

    if (!targetMembership) {
      return { error: "Usuario no encontrado en la clínica." };
    }

    if (currentUserRole === "admin" && targetMembership.role === "owner") {
      return { error: "No tienes permiso para expulsar a un Owner." };
    }

    const { error } = await supabase
      .from("user_clinicas")
      .delete()
      .eq("user_id", userId)
      .eq("clinica_id", clinicaId);

    if (error) throw error;

    revalidatePath("/(operativo)/ajustes", "layout");
    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function getInvitationDetails(invitationId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clinica_invitations")
      .select("id, email, clinica_id, role, status, expires_at, clinicas(nombre)")
      .eq("id", invitationId)
      .single();

    if (error) throw error;

    return { error: null, data };
  } catch (error: unknown) {
    return { error: getErrorMessage(error), data: null };
  }
}

export async function acceptInvitation(invitationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Debes iniciar sesión para aceptar la invitación." };
    }

    const { data: invitation, error } = await supabase
      .from("clinica_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (error || !invitation) {
      return { error: "Invitación inválida o no encontrada." };
    }

    if (invitation.status !== "pending") {
      return { error: "Esta invitación ya fue procesada." };
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return { error: "Esta invitación ha expirado." };
    }

    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return { error: "Esta invitación fue enviada a otro correo electrónico." };
    }

    // Insert user into user_clinicas
    const { error: insertError } = await supabase
      .from("user_clinicas")
      .insert({
        user_id: user.id,
        clinica_id: invitation.clinica_id,
        role: invitation.role,
      });

    if (insertError) {
      if (insertError.code === "23505") { // unique violation
        // Even if they are already in the clinic, mark invitation as accepted
        await supabase.from("clinica_invitations").update({ status: "accepted" }).eq("id", invitationId);
        return { error: "Ya eres miembro de esta clínica." };
      }
      throw insertError;
    }

    // Mark invitation as accepted
    await supabase
      .from("clinica_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    return { error: null, data: { clinicaId: invitation.clinica_id } };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}
