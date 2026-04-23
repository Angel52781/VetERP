"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createClinica, type CreateClinicaState } from "./actions";

const initialState: CreateClinicaState = { error: null };

export default function CreateClinicaForm() {
  const [state, action, pending] = useActionState(createClinica, initialState);

  return (
    <Card className="flex flex-col border-dashed border-2 bg-transparent shadow-none">
      <CardHeader className="pb-4 flex-1">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Plus className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">Nueva clínica</CardTitle>
        <CardDescription>Crea un nuevo espacio</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="sr-only">Nombre de la clínica</Label>
            <Input id="nombre" name="nombre" placeholder="Nombre de la clínica" className="bg-background" />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            Crear y entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

