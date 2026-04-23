"use server";

export type SignupState = { error: string | null };

export async function signup(): Promise<SignupState> {
  return {
    error: "El registro publico esta deshabilitado. Solicita acceso al administrador.",
  };
}
