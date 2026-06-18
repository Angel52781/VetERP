import { citaSchema, type CitaInput } from "@/lib/validators/agenda";
import type { CitaAgenda } from "./types";

const citaInputWithNotes: CitaInput = {
  cliente_id: "11111111-1111-4111-8111-111111111111",
  mascota_id: "22222222-2222-4222-8222-222222222222",
  tipo_cita_id: "33333333-3333-4333-8333-333333333333",
  start_date: "2026-05-26T09:00:00.000Z",
  end_date: "2026-05-26T09:30:00.000Z",
  notas_text: "Cuidado con orejas. Otitis reportada.",
};

const parsedCita = citaSchema.parse(citaInputWithNotes);
const parsedNotes: string | null | undefined = parsedCita.notas_text;

const agendaCitaWithNotes: CitaAgenda = {
  id: "44444444-4444-4444-8444-444444444444",
  start_date: "2026-05-26T09:00:00.000Z",
  end_date: "2026-05-26T09:30:00.000Z",
  estado: "programada",
  tipo_cita_id: "33333333-3333-4333-8333-333333333333",
  cliente_id: "11111111-1111-4111-8111-111111111111",
  mascota_id: "22222222-2222-4222-8222-222222222222",
  notas_text: "Temperamento nervioso; usar bozal si hace falta.",
  clientes: { nombre: "Responsable Demo" },
  mascotas: { nombre: "Paciente Demo", codigo_text: "PAC-001" },
  tipo_citas: { nombre: "Grooming", color: "#0f766e", area: "grooming" },
};

const agendaNotes: string | null | undefined = agendaCitaWithNotes.notas_text;

export { agendaNotes, parsedNotes };
