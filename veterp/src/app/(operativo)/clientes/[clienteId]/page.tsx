import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

import MascotaForm from "./mascota-form";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id,nombre,telefono,email")
    .eq("id", clienteId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  if (!cliente) {
    notFound();
  }

  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id,nombre,especie,raza,nacimiento")
    .eq("cliente_id", clienteId)
    .eq("clinica_id", clinicaId)
    .order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {cliente.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cliente.telefono ?? "-"} · {cliente.email ?? "-"}
          </p>
        </div>
        <Link
          href="/clientes"
          className={buttonVariants({ variant: "outline" })}
        >
          Volver
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mascotas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especie</TableHead>
                  <TableHead>Raza</TableHead>
                  <TableHead>Nacimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(mascotas ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nombre}</TableCell>
                    <TableCell>{m.especie ?? "-"}</TableCell>
                    <TableCell>{m.raza ?? "-"}</TableCell>
                    <TableCell>{m.nacimiento ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {!mascotas?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Sin mascotas todavía.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <MascotaForm clienteId={clienteId} />
      </div>
    </div>
  );
}
