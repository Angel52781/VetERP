"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clienteSchema, type ClienteFormValues } from "@/lib/validators/clientes";

import { createCliente } from "../actions";

export default function NuevoClientePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nombre: "", telefono: "", email: "" },
  });

  function onSubmit(values: ClienteFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await createCliente(values);
      if (result.error || !result.clienteId) {
        setError(result.error ?? "No se pudo crear el cliente.");
        return;
      }
      router.push(`/clientes/${result.clienteId}`);
    });
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo cliente</h1>
        <Link href="/clientes" className={buttonVariants({ variant: "outline" })}>
          Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" {...form.register("nombre")} />
              {form.formState.errors.nombre ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...form.register("telefono")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={pending}>
              Crear cliente
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
