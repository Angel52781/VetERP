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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clienteSchema,
  formatTipoDocumentoLabel,
  tipoDocumentoClienteValues,
  type ClienteFormValues,
} from "@/lib/validators/clientes";

type ClienteEditDialogProps = {
  cliente: {
    id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
    tipo_documento_text?: string | null;
    numero_documento_text?: string | null;
    direccion_principal_text?: string | null;
    referencia_direccion_text?: string | null;
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
      tipo_documento_text: (cliente.tipo_documento_text as ClienteFormValues["tipo_documento_text"]) ?? undefined,
      numero_documento_text: cliente.numero_documento_text ?? "",
      direccion_principal_text: cliente.direccion_principal_text ?? "",
      referencia_direccion_text: cliente.referencia_direccion_text ?? "",
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
        tipo_documento_text: (cliente.tipo_documento_text as ClienteFormValues["tipo_documento_text"]) ?? undefined,
        numero_documento_text: cliente.numero_documento_text ?? "",
        direccion_principal_text: cliente.direccion_principal_text ?? "",
        referencia_direccion_text: cliente.referencia_direccion_text ?? "",
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
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
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
          <section className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-semibold">Identificacion</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-tipo-documento">Tipo de documento</Label>
                <Select
                  value={form.watch("tipo_documento_text") || "none"}
                  onValueChange={(value) => {
                    form.setValue(
                      "tipo_documento_text",
                      value === "none" ? undefined : (value as ClienteFormValues["tipo_documento_text"]),
                      { shouldDirty: true, shouldValidate: true },
                    );
                    if (value === "none") {
                      form.setValue("numero_documento_text", "", { shouldDirty: true, shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger id="edit-cliente-tipo-documento" className="w-full">
                    <SelectValue placeholder="Sin documento">
                      {formatTipoDocumentoLabel(form.watch("tipo_documento_text"))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin documento</SelectItem>
                    {tipoDocumentoClienteValues.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {formatTipoDocumentoLabel(tipo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.tipo_documento_text ? (
                  <p className="text-sm text-destructive">{form.formState.errors.tipo_documento_text.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cliente-numero-documento">Numero de documento</Label>
                <Input id="edit-cliente-numero-documento" {...form.register("numero_documento_text")} />
                {form.formState.errors.numero_documento_text ? (
                  <p className="text-sm text-destructive">{form.formState.errors.numero_documento_text.message}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-semibold">Direccion</p>
            <div className="space-y-2">
              <Label htmlFor="edit-cliente-direccion">Direccion principal</Label>
              <Input id="edit-cliente-direccion" {...form.register("direccion_principal_text")} />
              {form.formState.errors.direccion_principal_text ? (
                <p className="text-sm text-destructive">{form.formState.errors.direccion_principal_text.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cliente-referencia-direccion">Referencia de direccion</Label>
              <Input id="edit-cliente-referencia-direccion" {...form.register("referencia_direccion_text")} />
              {form.formState.errors.referencia_direccion_text ? (
                <p className="text-sm text-destructive">{form.formState.errors.referencia_direccion_text.message}</p>
              ) : null}
            </div>
          </section>
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
