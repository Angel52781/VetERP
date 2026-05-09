export type CitaEstado =
  | "programada"
  | "confirmada"
  | "llego"
  | "en_atencion"
  | "completada"
  | "cancelada"
  | "no_asistio";

export type OrdenEstado = "open" | "in_progress" | "finished" | "closed";
export type GroomingEstado = "pendiente" | "completado";
export type VentaEstado = "abierta" | "pagada" | "anulada";

export type OperationalTone = "neutral" | "info" | "warning" | "success" | "danger";

export type OperationalStatusMeta = {
  label: string;
  tone: OperationalTone;
  description?: string;
  priority?: number;
};

export type CombinedOperationalInput = {
  citaEstado?: string | null;
  ordenEstado?: string | null;
  groomingEstado?: string | null;
  ventaEstado?: string | null;
};

const FALLBACK_STATUS: OperationalStatusMeta = {
  label: "Estado operativo",
  tone: "neutral",
};

const CITA_STATUS: Record<CitaEstado, OperationalStatusMeta> = {
  programada: { label: "Programada", tone: "neutral", priority: 12 },
  confirmada: { label: "Confirmada", tone: "info", priority: 11 },
  llego: { label: "Llegó", tone: "warning", priority: 10 },
  en_atencion: { label: "En atención", tone: "info", priority: 9 },
  completada: { label: "Completada", tone: "success", priority: 13 },
  cancelada: { label: "Cancelada", tone: "danger", priority: 1 },
  no_asistio: { label: "No asistió", tone: "warning", priority: 1 },
};

const ORDEN_STATUS: Record<OrdenEstado, OperationalStatusMeta> = {
  open: { label: "Orden abierta", tone: "warning", priority: 5 },
  in_progress: { label: "Orden en progreso", tone: "info", priority: 4 },
  finished: { label: "Orden finalizada", tone: "success", priority: 6 },
  closed: { label: "Orden cerrada", tone: "neutral", priority: 13 },
};

const GROOMING_STATUS: Record<GroomingEstado, OperationalStatusMeta> = {
  pendiente: { label: "Grooming pendiente", tone: "warning", priority: 8 },
  completado: { label: "Grooming completado", tone: "success", priority: 7 },
};

const VENTA_STATUS: Record<VentaEstado, OperationalStatusMeta> = {
  abierta: { label: "Por cobrar", tone: "warning", priority: 3 },
  pagada: { label: "Pagada", tone: "success", priority: 2 },
  anulada: { label: "Venta anulada", tone: "neutral", priority: 13 },
};

export function getCitaStatusMeta(estado?: string | null): OperationalStatusMeta {
  if (!estado || !(estado in CITA_STATUS)) return FALLBACK_STATUS;
  return CITA_STATUS[estado as CitaEstado];
}

export function getOrdenStatusMeta(estado?: string | null): OperationalStatusMeta {
  if (!estado || !(estado in ORDEN_STATUS)) return FALLBACK_STATUS;
  return ORDEN_STATUS[estado as OrdenEstado];
}

export function getGroomingStatusMeta(estado?: string | null): OperationalStatusMeta {
  if (!estado || !(estado in GROOMING_STATUS)) return FALLBACK_STATUS;
  return GROOMING_STATUS[estado as GroomingEstado];
}

export function getVentaStatusMeta(estado?: string | null): OperationalStatusMeta {
  if (!estado || !(estado in VENTA_STATUS)) return FALLBACK_STATUS;
  return VENTA_STATUS[estado as VentaEstado];
}

export function getToneBadgeClass(tone: OperationalTone) {
  const classes: Record<OperationalTone, string> = {
    neutral: "bg-secondary text-secondary-foreground",
    info: "bg-blue-100 text-blue-800",
    warning: "bg-amber-100 text-amber-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
  };
  return classes[tone];
}

export function getBadgeVariantByTone(tone: OperationalTone): "default" | "secondary" | "destructive" | "outline" {
  if (tone === "danger") return "destructive";
  if (tone === "success" || tone === "info") return "default";
  if (tone === "neutral") return "outline";
  return "secondary";
}

export function getCombinedOperationalStatus(input: CombinedOperationalInput): OperationalStatusMeta {
  const citaEstado = input.citaEstado ?? null;
  const ordenEstado = input.ordenEstado ?? null;
  const groomingEstado = input.groomingEstado ?? null;
  const ventaEstado = input.ventaEstado ?? null;

  if (citaEstado === "cancelada" || citaEstado === "no_asistio") return getCitaStatusMeta(citaEstado);
  if (ventaEstado === "pagada") return getVentaStatusMeta("pagada");
  if (ventaEstado === "abierta") return getVentaStatusMeta("abierta");
  if (ordenEstado === "in_progress") return getOrdenStatusMeta("in_progress");
  if (ordenEstado === "open") return getOrdenStatusMeta("open");
  if (ordenEstado === "finished") return getOrdenStatusMeta("finished");
  if (groomingEstado === "completado") return getGroomingStatusMeta("completado");
  if (groomingEstado === "pendiente") return getGroomingStatusMeta("pendiente");
  if (citaEstado === "en_atencion") return getCitaStatusMeta("en_atencion");
  if (citaEstado === "llego") return getCitaStatusMeta("llego");
  if (citaEstado === "confirmada") return getCitaStatusMeta("confirmada");
  if (citaEstado === "programada") return getCitaStatusMeta("programada");
  if (citaEstado === "completada") return getCitaStatusMeta("completada");
  if (ordenEstado === "closed") return getOrdenStatusMeta("closed");
  if (ventaEstado === "anulada") return getVentaStatusMeta("anulada");

  return FALLBACK_STATUS;
}
