import Link from "next/link";
import { Users } from "lucide-react";

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
import { EmptyState } from "@/components/empty-state";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function ClientesPage() {
  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id,nombre,telefono,email,created_at")
    .eq("clinica_id", clinicaId)
    .order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <Link href="/clientes/nuevo" className={buttonVariants({})}>
          Nuevo cliente
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(clientes ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link className="hover:underline" href={`/clientes/${c.id}`}>
                      {c.nombre}
                    </Link>
                  </TableCell>
                  <TableCell>{c.telefono ?? "-"}</TableCell>
                  <TableCell>{c.email ?? "-"}</TableCell>
                  <TableCell>{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
              {!clientes?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="No hay clientes"
                      description="Agrega tu primer cliente para empezar a registrar atenciones."
                      action={
                        <Link href="/clientes/nuevo" className={buttonVariants({ variant: "outline" })}>
                          Nuevo cliente
                        </Link>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
