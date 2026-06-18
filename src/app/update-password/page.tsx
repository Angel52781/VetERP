"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updatePassword, type UpdatePasswordState } from "./actions";

const initialState: UpdatePasswordState = { error: null };

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Actualizar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para acceder a tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              Actualizar y Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
