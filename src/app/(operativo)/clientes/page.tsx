import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { IdCard, Mail, MapPin, PawPrint, Phone, Plus, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { formatMoneyPEN } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { formatClienteDocumento } from "@/lib/validators/clientes";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = await createClient();
  const clinicaId = await requireClinicaIdFromCookies();

  // Traemos clientes con count de mascotas y última orden
  const { data: clientes } = await supabase
    .from("clientes")
    .select(`
      id, nombre, telefono, email, tipo_documento_text, numero_documento_text,
      direccion_principal_text, referencia_direccion_text, created_at,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes?.length ?? 0} cliente{clientes?.length !== 1 ? "s" : ""} registrados
          </p>
        </div>
        <Link href="/clientes/nuevo" className={buttonVariants({ className: "w-full sm:w-auto" })}>
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
              Crea tu primer cliente para comenzar a registrar pacientes y atenciones.
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
            const documento = formatClienteDocumento(c.tipo_documento_text, c.numero_documento_text);
            const mascotasCount = (c.mascotas as any[])?.length ?? 0;
            const ordenes = (c.ordenes_servicio as any[]) ?? [];
            const ultimaOrden = ordenes.sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            const ordenActiva = ordenes.find((o: any) => ["open", "in_progress"].includes(o.estado_text));
            const tieneOrdenActiva = Boolean(ordenActiva);
            
            const ventas = (c.ventas as any[]) ?? [];
            const deudaTotal = ventas.filter(v => v.estado !== "pagada").reduce((acc, v) => {
              const pagado = (v.ledger || []).reduce((pAcc: number, l: any) => pAcc + Number(l.monto), 0);
              return acc + Math.max(0, Number(v.total) - pagado);
            }, 0);

            return (
              <div
                key={c.id}
                className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                {/* Avatar inicial */}
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0 select-none">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Info principal */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/clientes/${c.id}`} className="font-medium text-sm truncate hover:underline">
                      {c.nombre}
                    </Link>
                    {tieneOrdenActiva && (
                      <span className="shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                        En atención
                      </span>
                    )}
                    {deudaTotal > 0 && (
                      <span className="shrink-0 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                        Deuda: {formatMoneyPEN(deudaTotal)}
                      </span>
                    )}
                    {ordenActiva ? (
                      <Link
                        href={`/orden_y_colas/${ordenActiva.id}?returnTo=${encodeURIComponent("/clientes")}`}
                        className={buttonVariants({ variant: "outline", size: "sm", className: "h-6 px-2 text-[11px]" })}
                      >
                        Ver atención
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {documento && (
                      <span className="flex items-center gap-1">
                        <IdCard className="h-3 w-3" /> {documento}
                      </span>
                    )}
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
                  {c.direccion_principal_text && (
                    <div className="mt-1 flex min-w-0 items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {c.direccion_principal_text}
                        {c.referencia_direccion_text ? ` - ${c.referencia_direccion_text}` : ""}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:hidden">
                    <div>
                      <p className="font-semibold">{mascotasCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {mascotasCount === 1 ? "paciente" : "pacientes"}
                      </p>
                    </div>
                    <div>
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
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-semibold">{mascotasCount}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <PawPrint className="h-3 w-3" />
                      {mascotasCount === 1 ? "paciente" : "pacientes"}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
