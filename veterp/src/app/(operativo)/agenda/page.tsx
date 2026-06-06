import { getCitas, getClientesParaAgenda, getTiposCita, getTiposCitaForManagement } from "./actions";
import { AgendaClient } from "./agenda-client";

export const metadata = {
  title: "Agenda | VetERP",
  description: "Gestión de citas y agenda",
};

export default async function AgendaPage() {
  const today = new Date();

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);

  const [citasRes, tiposRes, tiposGestionRes, clientesRes] = await Promise.all([
    getCitas(startDate.toISOString(), endDate.toISOString()),
    getTiposCita(),
    getTiposCitaForManagement(),
    getClientesParaAgenda(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AgendaClient
        citas={citasRes.data || []}
        tiposCita={tiposRes.data || []}
        tiposCitaGestion={tiposGestionRes.data || []}
        clientes={clientesRes.data || []}
      />
    </div>
  );
}
