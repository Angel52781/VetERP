import { getClientesParaAgenda } from "../agenda/actions";
import { getOrdenesServicio } from "../index/actions";
import { NuevaAtencionForm } from "../index/nueva-atencion-form";
import { OrdenList } from "../index/orden-list";

export const dynamic = "force-dynamic";

export default async function AtencionesPage() {
  const [{ data: ordenes, error: ordenesError }, { data: clientes }] = await Promise.all([
    getOrdenesServicio(),
    getClientesParaAgenda(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Atenciones Activas (Sala de Espera)</h1>
        <p className="text-sm text-muted-foreground">
          Pacientes que están actualmente en la clínica en proceso de atención.
        </p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1"></div>
        <div>{clientes && <NuevaAtencionForm clientes={clientes} />}</div>
      </div>

      {ordenesError ? (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          Error al cargar las órdenes de servicio: {ordenesError}
        </div>
      ) : (
        <OrdenList ordenes={ordenes || []} />
      )}
    </div>
  );
}
