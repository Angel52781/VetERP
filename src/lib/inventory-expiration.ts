import { differenceInCalendarDays, format, isValid, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export type ExpirationStatus = "expired" | "warning" | "valid" | "none";

export type ExpirationMeta = {
  status: ExpirationStatus;
  label: "Vencido" | "Vence pronto" | "Vigente" | "Sin vencimiento";
  className: string;
  sortOrder: number;
  daysUntilExpiration: number | null;
  formattedDate: string | null;
};

const WARNING_DAYS = 30;

export function getExpirationMeta(
  expirationDate: string | null | undefined,
  referenceDate = new Date(),
): ExpirationMeta {
  if (!expirationDate) {
    return {
      status: "none",
      label: "Sin vencimiento",
      className: "bg-slate-100 text-slate-700 border-slate-200",
      sortOrder: 3,
      daysUntilExpiration: null,
      formattedDate: null,
    };
  }

  const parsedDate = parseISO(expirationDate);
  if (!isValid(parsedDate)) {
    return {
      status: "none",
      label: "Sin vencimiento",
      className: "bg-slate-100 text-slate-700 border-slate-200",
      sortOrder: 3,
      daysUntilExpiration: null,
      formattedDate: null,
    };
  }

  const safeDate = startOfDay(parsedDate);
  const safeReferenceDate = startOfDay(referenceDate);
  const daysUntilExpiration = differenceInCalendarDays(safeDate, safeReferenceDate);
  const formattedDate = format(safeDate, "dd MMM yyyy", { locale: es });

  if (daysUntilExpiration < 0) {
    return {
      status: "expired",
      label: "Vencido",
      className: "bg-red-100 text-red-800 border-red-200",
      sortOrder: 0,
      daysUntilExpiration,
      formattedDate,
    };
  }

  if (daysUntilExpiration <= WARNING_DAYS) {
    return {
      status: "warning",
      label: "Vence pronto",
      className: "bg-amber-100 text-amber-800 border-amber-200",
      sortOrder: 1,
      daysUntilExpiration,
      formattedDate,
    };
  }

  return {
    status: "valid",
    label: "Vigente",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    sortOrder: 2,
    daysUntilExpiration,
    formattedDate,
  };
}
