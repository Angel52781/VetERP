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

export const AREA_VISUAL_META: Record<CitaArea, {
  badgeClass: string;
  panelClass: string;
  dotClass: string;
}> = {
  clinica: {
    badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
    panelClass: "border-blue-200 bg-blue-50/70 text-blue-950",
    dotClass: "bg-blue-500",
  },
  banos: {
    badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-800",
    panelClass: "border-cyan-200 bg-cyan-50/70 text-cyan-950",
    dotClass: "bg-cyan-500",
  },
  grooming: {
    badgeClass: "border-teal-200 bg-teal-50 text-teal-800",
    panelClass: "border-teal-200 bg-teal-50/70 text-teal-950",
    dotClass: "bg-teal-500",
  },
  cirugia: {
    badgeClass: "border-rose-200 bg-rose-50 text-rose-800",
    panelClass: "border-rose-200 bg-rose-50/70 text-rose-950",
    dotClass: "bg-rose-500",
  },
  movilidad: {
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    panelClass: "border-amber-200 bg-amber-50/80 text-amber-950",
    dotClass: "bg-amber-500",
  },
  otro: {
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    panelClass: "border-slate-200 bg-slate-50/80 text-slate-900",
    dotClass: "bg-slate-500",
  },
};

export const AREA_ORDER: CitaArea[] = ["clinica", "banos", "grooming", "cirugia", "movilidad", "otro"];

export type TipoCitaAgenda = {
  id: string;
  nombre: string;
  duracion_min: number;
  color?: string | null;
  area?: CitaArea | string | null;
  is_disabled?: boolean | null;
};

export type AgendaMascotaSearch = {
  id: string;
  nombre: string;
  codigo_text?: string | null;
};

export type AgendaClienteSearch = {
  id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  tipo_documento_text?: string | null;
  numero_documento_text?: string | null;
  direccion_principal_text?: string | null;
  referencia_direccion_text?: string | null;
  documento?: string | null;
  dni?: string | null;
  documento_text?: string | null;
  mascotas?: AgendaMascotaSearch[] | null;
};

export type AgendaClienteSearchResult = {
  cliente: AgendaClienteSearch;
  mascotas: AgendaMascotaSearch[];
  matchingMascotas: AgendaMascotaSearch[];
  matchesCliente: boolean;
};

export type CitaAgenda = {
  id: string;
  start_date: string;
  end_date: string;
  estado?: string | null;
  notas_text?: string | null;
  movilidad_usa_direccion_cliente?: boolean | null;
  movilidad_direccion_text?: string | null;
  movilidad_referencia_text?: string | null;
  tipo_cita_id: string;
  cliente_id: string;
  mascota_id: string;
  active_order_id?: string | null;
  active_order_estado_text?: string | null;
  clientes: { nombre: string } | null;
  mascotas: { nombre: string; codigo_text?: string | null } | null;
  tipo_citas: { nombre: string; color: string | null; area?: CitaArea | string | null; is_disabled?: boolean | null } | null;
};

export function normalizeCitaArea(area: string | null | undefined): CitaArea {
  return CITA_AREAS.includes(area as CitaArea) ? (area as CitaArea) : "clinica";
}

export function getCitaAreaLabel(area: string | null | undefined) {
  return AREA_META[normalizeCitaArea(area)].shortLabel;
}

export function getCitaAreaPresentation(area: string | null | undefined) {
  const normalizedArea = normalizeCitaArea(area);
  return {
    ...AREA_META[normalizedArea],
    ...AREA_VISUAL_META[normalizedArea],
  };
}
