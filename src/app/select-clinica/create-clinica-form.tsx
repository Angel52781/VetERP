"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createClinica, type CreateClinicaState } from "./actions";

const initialState: CreateClinicaState = { error: null };

export default function CreateClinicaForm() {
  const [state, action, pending] = useActionState(createClinica, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva clínica</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            Crear y entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

