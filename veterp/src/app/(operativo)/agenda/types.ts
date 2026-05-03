export const CITA_AREAS = ["clinica", "banos", "grooming", "cirugia", "movilidad", "otro"] as const;

export type CitaArea = (typeof CITA_AREAS)[number];

export const AREA_META: Record<CitaArea, { label: string; shortLabel: string }> = {
  clinica: { label: "Clínica", shortLabel: "Clínica" },
  banos: { label: "Baños", shortLabel: "Baños" },
  grooming: { label: "Grooming", shortLabel: "Grooming" },
  cirugia: { label: "Cirugías", shortLabel: "Cirugía" },
  movilidad: { label: "Movilidad", shortLabel: "Movilidad" },
  otro: { label: "Otro", shortLabel: "Otro" },
};

export const AREA_ORDER: CitaArea[] = ["clinica", "banos", "grooming", "cirugia", "movilidad", "otro"];

export type TipoCitaAgenda = {
  id: string;
  nombre: string;
  duracion_min: number;
  color?: string | null;
  area?: CitaArea | string | null;
};

export type CitaAgenda = {
  id: string;
  start_date: string;
  end_date: string;
  estado?: string | null;
  tipo_cita_id: string;
  cliente_id: string;
  mascota_id: string;
  active_order_id?: string | null;
  active_order_estado_text?: string | null;
  clientes: { nombre: string } | null;
  mascotas: { nombre: string } | null;
  tipo_citas: { nombre: string; color: string | null; area?: CitaArea | string | null } | null;
};

export function normalizeCitaArea(area: string | null | undefined): CitaArea {
  return CITA_AREAS.includes(area as CitaArea) ? (area as CitaArea) : "clinica";
}

export function getCitaAreaLabel(area: string | null | undefined) {
  return AREA_META[normalizeCitaArea(area)].shortLabel;
}
