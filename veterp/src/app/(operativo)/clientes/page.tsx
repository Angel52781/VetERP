import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PawPrint, Phone, Mail, Plus, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();

  // Traemos clientes con count de mascotas y última orden
  const { data: clientes } = await supabase
    .from("clientes")
    .select(`
      id, nombre, telefono, email, created_at,
      mascotas ( id ),
      ordenes_servicio (
        id, estado_text, started_at, created_at
      ),
      ventas (
        estado,
        total,
        ledger ( monto )
      )
    `)
    .eq("clinica_id", clinicaId)
    .order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes?.length ?? 0} cliente{clientes?.length !== 1 ? "s" : ""} registrados
          </p>
        </div>
        <Link href="/clientes/nuevo" className={buttonVariants({})}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo cliente
        </Link>
      </div>

      {!clientes?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-3">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">Aún no hay clientes registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primer cliente para comenzar a registrar mascotas y atenciones.
            </p>
          </div>
          <Link href="/clientes/nuevo" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-1.5 h-4 w-4" />
            Registrar primer cliente
          </Link>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {clientes.map((c) => {
            const mascotasCount = (c.mascotas as any[])?.length ?? 0;
            const ordenes = (c.ordenes_servicio as any[]) ?? [];
            const ultimaOrden = ordenes.sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            const tieneOrdenActiva = ordenes.some((o: any) =>
              ["open", "in_progress"].includes(o.estado_text)
            );
            
            const ventas = (c.ventas as any[]) ?? [];
            const deudaTotal = ventas.filter(v => v.estado !== "pagada").reduce((acc, v) => {
              const pagado = (v.ledger || []).reduce((pAcc: number, l: any) => pAcc + Number(l.monto), 0);
              return acc + Math.max(0, Number(v.total) - pagado);
            }, 0);

            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-muted/40 transition-colors"
              >
                {/* Avatar inicial */}
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0 select-none">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{c.nombre}</p>
                    {tieneOrdenActiva && (
                      <span className="shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                        En atención
                      </span>
                    )}
                    {deudaTotal > 0 && (
                      <span className="shrink-0 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                        Deuda: ${deudaTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {c.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.telefono}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-semibold">{mascotasCount}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <PawPrint className="h-3 w-3" />
                      {mascotasCount === 1 ? "mascota" : "mascotas"}
                    </p>
                  </div>
                  <div className="text-center min-w-[90px]">
                    {ultimaOrden ? (
                      <>
                        <p className="font-semibold text-xs">
                          {format(new Date(ultimaOrden.created_at), "dd MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">Última atención</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-xs text-muted-foreground">—</p>
                        <p className="text-xs text-muted-foreground">Sin atenciones</p>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
