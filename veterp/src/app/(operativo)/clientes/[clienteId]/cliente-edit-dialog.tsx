"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { updateCliente } from "@/app/(operativo)/clientes/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clienteSchema, type ClienteFormValues } from "@/lib/validators/clientes";

type ClienteEditDialogProps = {
  cliente: {
    id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
  };
};

export function ClienteEditDialog({ cliente }: ClienteEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente.nombre,
      telefono: cliente.telefono ?? "",
      email: cliente.email ?? "",
    },
  });

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setError(null);
      form.reset({
        nombre: cliente.nombre,
        telefono: cliente.telefono ?? "",
        email: cliente.email ?? "",
      });
    }
  }

  function onSubmit(values: ClienteFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await updateCliente(cliente.id, values);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil className="mr-2 h-4 w-4" />
        Editar cliente
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="edit-cliente-nombre">Nombre</Label>
            <Input id="edit-cliente-nombre" {...form.register("nombre")} />
            {form.formState.errors.nombre ? (
              <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cliente-telefono">Telefono</Label>
            <Input id="edit-cliente-telefono" {...form.register("telefono")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cliente-email">Email</Label>
            <Input id="edit-cliente-email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
