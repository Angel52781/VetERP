import { getOrdenesServicio } from "./actions";
import { getClientesParaAgenda } from "../agenda/actions";
import { OrdenList } from "./orden-list";
import { NuevaAtencionForm } from "./nueva-atencion-form";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const [{ data: ordenes, error: ordenesError }, { data: clientes }] = await Promise.all([
    getOrdenesServicio(),
    getClientesParaAgenda(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Atenciones Activas</h2>
        <div className="flex items-center space-x-2">
          {clientes && <NuevaAtencionForm clientes={clientes} />}
        </div>
      </div>

      {ordenesError ? (
        <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
          Error al cargar las órdenes de servicio: {ordenesError}
        </div>
      ) : (
        <OrdenList ordenes={ordenes || []} />
      )}
    </div>
  );
}
