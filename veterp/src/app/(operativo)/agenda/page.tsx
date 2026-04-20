import { getCitas, getTiposCita, getClientesParaAgenda } from "./actions";
import { AgendaClient } from "./agenda-client";

export const metadata = {
  title: "Agenda | VetERP",
  description: "Gestión de citas y agenda",
};

export default async function AgendaPage() {
  // Por defecto, cargamos las citas de los próximos 30 días y los 7 días anteriores
  const today = new Date();
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);

  const [citasRes, tiposRes, clientesRes] = await Promise.all([
    getCitas(startDate.toISOString(), endDate.toISOString()),
    getTiposCita(),
    getClientesParaAgenda(),
  ]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <AgendaClient
        citas={citasRes.data || []}
        tiposCita={tiposRes.data || []}
        clientes={clientesRes.data || []}
      />
    </div>
  );
}
