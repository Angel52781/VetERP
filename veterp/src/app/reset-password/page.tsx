"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { resetPassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = { error: null, success: null };

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico para recibir un enlace de recuperación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            
            {state.success ? (
              <p className="text-sm text-green-600 dark:text-green-500">{state.success}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              Enviar Enlace
            </Button>
            <div className="text-center text-sm mt-4">
              <Link href="/login" className="text-muted-foreground hover:underline">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
