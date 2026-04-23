import Link from "next/link";
import { Users, Phone, Mail, PawPrint } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    .select("id, nombre, apellidos, telefono, email, created_at, mascotas(count)")
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
          <CardTitle className="text-base">Listado de Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-center">Mascotas</TableHead>
                  <TableHead className="text-right">Fecha Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(clientes ?? []).map((c: any) => {
                  const numMascotas = c.mascotas?.[0]?.count ?? 0;
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {c.nombre?.charAt(0).toUpperCase()}
                            {c.apellidos?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <Link className="hover:underline text-sm font-semibold" href={`/clientes/${c.id}`}>
                              {c.nombre} {c.apellidos}
                            </Link>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {c.telefono ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {c.telefono}
                            </div>
                          ) : null}
                          {c.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </div>
                          ) : null}
                          {!c.telefono && !c.email && (
                            <span className="italic">Sin contacto</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-medium">
                          <PawPrint className="mr-1 h-3 w-3" />
                          {numMascotas} {numMascotas === 1 ? 'Mascota' : 'Mascotas'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(c.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!clientes?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
