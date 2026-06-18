import Link from "next/link";
import { redirect } from "next/navigation";
import { addDays, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActiveClinicaContext } from "@/lib/clinica";
import { formatBreedLabel, formatSpeciesLabel } from "@/lib/patient-labels";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { formatRecurrencia, getSeguimientoTipoLabel } from "@/lib/validators/recordatorios";
import { RecordatorioActions } from "./recordatorio-actions";

export const dynamic = "force-dynamic";

type FiltroRecordatorios = "vencidos" | "7d" | "30d";

type RecordatorioRow = {
  id: string;
  tipo_text: string;
  estado_text: string | null;
  nombre_text: string;
  proxima_fecha_date: string;
  notas_text: string | null;
  orden_id: string | null;
  recurrencia_unidad_text: string | null;
  recurrencia_cada_int: number | null;
  mascotas: {
    id: string;
    nombre: string;
    codigo_text: string | null;
    especie: string | null;
    raza: string | null;
    clientes: {
      id: string;
      nombre: string;
    } | null;
  } | null;
};

type PageProps = {
  searchParams?: Promise<{
    filtro?: string | string[];
  }>;
};

const FILTRO_LABELS: Record<FiltroRecordatorios, string> = {
  vencidos: "Vencidos",
  "7d": "Proximos 7 dias",
  "30d": "Proximos 30 dias",
};

function normalizeFiltro(value: string | string[] | undefined): FiltroRecordatorios {
  const filtro = Array.isArray(value) ? value[0] : value;
  if (filtro === "vencidos" || filtro === "7d" || filtro === "30d") {
    return filtro;
  }
  return "7d";
}

function getDateRange(filtro: FiltroRecordatorios) {
  const now = new Date();
  const todayDate = format(now, "yyyy-MM-dd");
  const day7Date = format(addDays(now, 7), "yyyy-MM-dd");
  const day8Date = format(addDays(now, 8), "yyyy-MM-dd");
  const day30Date = format(addDays(now, 30), "yyyy-MM-dd");

  if (filtro === "vencidos") {
    return { todayDate, from: null, to: todayDate };
  }

  if (filtro === "30d") {
    return { todayDate, from: day8Date, to: day30Date };
  }

  return { todayDate, from: todayDate, to: day7Date };
}

function getStatusMeta(fecha: string, todayDate: string) {
  if (fecha < todayDate) {
    return {
      label: "Vencido",
      className: "bg-red-100 text-red-800",
      icon: AlertCircle,
    };
  }

  return {
    label: "Proximo",
    className: "bg-blue-100 text-blue-800",
    icon: Clock,
  };
}

function getTipoMeta(tipo: string) {
  if (tipo === "vacuna") {
    return {
      label: getSeguimientoTipoLabel(tipo),
      icon: ShieldCheck,
      className: "bg-blue-50 text-blue-700",
    };
  }

  if (tipo === "control") {
    return {
      label: getSeguimientoTipoLabel(tipo),
      icon: Stethoscope,
      className: "bg-purple-50 text-purple-700",
    };
  }

  return {
    label: getSeguimientoTipoLabel(tipo),
    icon: FileText,
    className: "bg-muted text-muted-foreground",
  };
}

function getEmptyMessage(filtro: FiltroRecordatorios) {
  if (filtro === "vencidos") {
    return "No hay recordatorios vencidos.";
  }
  if (filtro === "30d") {
    return "No hay recordatorios entre los proximos 8 y 30 dias.";
  }
  return "No hay recordatorios para los proximos 7 dias.";
}

export default async function RecordatoriosPage({ searchParams }: PageProps) {
  const context = await getActiveClinicaContext();
  if (!context) redirect("/select-clinica");

  const params = (await searchParams) ?? {};
  const filtro = normalizeFiltro(params.filtro);
  const { todayDate, from, to } = getDateRange(filtro);
  const supabase = await createClient();

  let query = supabase
    .from("seguimientos_clinicos")
    .select(`
      id,
      tipo_text,
      estado_text,
      nombre_text,
      proxima_fecha_date,
      notas_text,
      orden_id,
      recurrencia_unidad_text,
      recurrencia_cada_int,
      mascotas:mascota_id (
        id,
        nombre,
        codigo_text,
        especie,
        raza,
        clientes:cliente_id ( id, nombre )
      )
    `)
    .eq("clinica_id", context.clinicaId)
    .eq("estado_text", "pendiente")
    .not("proxima_fecha_date", "is", null)
    .order("proxima_fecha_date", { ascending: true });

  if (filtro === "vencidos") {
    query = query.lt("proxima_fecha_date", to);
  } else {
    query = query.gte("proxima_fecha_date", from).lte("proxima_fecha_date", to);
  }

  const { data, error } = await query;
  const recordatorios = (data ?? []) as unknown as RecordatorioRow[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Inicio
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recordatorios</h1>
          <p className="text-sm text-muted-foreground">
            Seguimientos, controles, vacunas y pendientes programados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="w-fit">
            {FILTRO_LABELS[filtro]}
          </Badge>
          <Link href="/mascotas" className={buttonVariants({ variant: "default", size: "sm" })}>
            Nuevo Seguimiento
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {(["vencidos", "7d", "30d"] as const).map((item) => (
          <Link
            key={item}
            href={`/recordatorios?filtro=${item}`}
            className={buttonVariants({
              variant: filtro === item ? "default" : "outline",
              size: "sm",
            })}
          >
            {FILTRO_LABELS[item]}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {FILTRO_LABELS[filtro]}
          </CardTitle>
          <CardDescription>
            {filtro === "vencidos"
              ? "Fechas anteriores a hoy."
              : filtro === "30d"
                ? "Desde manana + 7 dias hasta los proximos 30 dias."
                : "Desde hoy hasta los proximos 7 dias."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No se pudieron cargar los recordatorios: {error.message}
            </div>
          ) : recordatorios.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              {getEmptyMessage(filtro)}
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {recordatorios.map((recordatorio) => {
                const paciente = recordatorio.mascotas;
                const responsable = paciente?.clientes;
                const status = getStatusMeta(recordatorio.proxima_fecha_date, todayDate);
                const tipo = getTipoMeta(recordatorio.tipo_text);
                const StatusIcon = status.icon;
                const TipoIcon = tipo.icon;

                return (
                  <div
                    key={recordatorio.id}
                    className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className={cn("rounded-full p-2", tipo.className)}>
                        <TipoIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {paciente?.nombre ?? "Paciente sin nombre"}
                          </p>
                          {paciente?.codigo_text?.trim() ? (
                            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                              #{paciente.codigo_text}
                            </Badge>
                          ) : null}
                          <Badge variant="secondary">{tipo.label}</Badge>
                          <Badge className={cn("border-none", status.className)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm font-medium">{recordatorio.nombre_text}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {responsable?.nombre ?? "Responsable no disponible"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <PawPrint className="h-3 w-3" />
                            {formatSpeciesLabel(paciente?.especie)} / {formatBreedLabel(paciente?.raza)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(
                              startOfDay(new Date(`${recordatorio.proxima_fecha_date}T00:00:00`)),
                              "dd MMM yyyy",
                              { locale: es },
                            )}
                          </span>
                          {recordatorio.recurrencia_unidad_text && recordatorio.recurrencia_cada_int && (
                            <span className="inline-flex items-center gap-1 text-primary/80">
                              ↻ {formatRecurrencia(recordatorio.recurrencia_cada_int, recordatorio.recurrencia_unidad_text)}
                            </span>
                          )}
                        </div>
                        {recordatorio.notas_text?.trim() ? (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {recordatorio.notas_text}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                      {paciente?.id ? (
                        <Link
                          href={`/mascotas/${paciente.id}?returnTo=${encodeURIComponent(`/recordatorios?filtro=${filtro}`)}`}
                          className={buttonVariants({ variant: "outline", size: "sm", className: "w-full sm:w-auto" })}
                        >
                          Ver paciente
                        </Link>
                      ) : null}
                      {recordatorio.orden_id ? (
                        <Link
                          href={`/orden_y_colas/${recordatorio.orden_id}?returnTo=${encodeURIComponent(`/recordatorios?filtro=${filtro}`)}`}
                          className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full sm:w-auto" })}
                        >
                          Ver atencion
                        </Link>
                      ) : null}
                      <RecordatorioActions
                        id={recordatorio.id}
                        fechaActual={recordatorio.proxima_fecha_date}
                        isRecurrent={!!recordatorio.recurrencia_unidad_text}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
