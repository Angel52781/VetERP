"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { citaSchema, type CitaInput } from "@/lib/validators/agenda";
import { formatClienteDocumento } from "@/lib/validators/clientes";
import { createCita, getMascotasDeCliente, updateCita } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterClienteSearchResults } from "./cita-search";
import {
  AREA_META,
  AREA_ORDER,
  getCitaAreaPresentation,
  normalizeCitaArea,
  type AgendaClienteSearch,
  type AgendaMascotaSearch,
  type TipoCitaAgenda,
} from "./types";

import { format, addMinutes } from "date-fns";

interface CitaFormProps {
  clientes: AgendaClienteSearch[];
  tiposCita: TipoCitaAgenda[];
  onSuccess?: () => void;
  initialDate?: string;
  initialClienteId?: string;
  citaId?: string;
  initialValues?: Partial<CitaInput>;
}

function toDateTimeLocalInput(value?: string, fallbackNow = false) {
  if (!value && fallbackNow) return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackNow ? format(new Date(), "yyyy-MM-dd'T'HH:mm") : "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function getTipoCitaLabel(tipo: TipoCitaAgenda) {
  const area = AREA_META[normalizeCitaArea(tipo.area)].shortLabel;
  return `${area} · ${tipo.nombre} (${tipo.duracion_min} min)`;
}

function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const sectionClass = "min-w-0 overflow-hidden rounded-lg border bg-muted/20 p-3";
const sectionTitleClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const hiddenScrollbarClass =
  "overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function CitaForm({
  clientes,
  tiposCita,
  onSuccess,
  initialDate,
  initialClienteId,
  citaId,
  initialValues,
}: CitaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mascotas, setMascotas] = useState<AgendaMascotaSearch[]>([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");
  const [tipoSearch, setTipoSearch] = useState("");

  const defaultStartDate = toDateTimeLocalInput(initialValues?.start_date || initialDate, true);
  const defaultEndDate = initialValues?.end_date
    ? toDateTimeLocalInput(initialValues.end_date)
    : format(addMinutes(new Date(defaultStartDate), 30), "yyyy-MM-dd'T'HH:mm");
  const safeInitialClienteId =
    (initialValues?.cliente_id || initialClienteId) &&
    clientes.some((c) => c.id === (initialValues?.cliente_id || initialClienteId))
      ? (initialValues?.cliente_id || initialClienteId)!
      : "";

  const form = useForm<CitaInput>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      cliente_id: safeInitialClienteId,
      mascota_id: initialValues?.mascota_id || "",
      tipo_cita_id: initialValues?.tipo_cita_id || "",
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      notas_text: initialValues?.notas_text ?? "",
    },
  });

  const selectedClienteId = form.watch("cliente_id");
  const selectedTipoCitaId = form.watch("tipo_cita_id");
  const selectedStartDate = form.watch("start_date");
  const selectedCliente = useMemo(
    () => clientes.find((cliente) => cliente.id === selectedClienteId) ?? null,
    [clientes, selectedClienteId],
  );
  const selectedClienteDocumento = selectedCliente
    ? formatClienteDocumento(selectedCliente.tipo_documento_text, selectedCliente.numero_documento_text)
    : null;
  const clienteSearchResults = useMemo(
    () => filterClienteSearchResults(clientes, clienteSearch, 5),
    [clientes, clienteSearch],
  );
  const currentTipoCitaId = initialValues?.tipo_cita_id ?? null;
  const tiposCitaDisponibles = useMemo(() => {
    return tiposCita.filter((tipo) => !tipo.is_disabled || tipo.id === currentTipoCitaId);
  }, [currentTipoCitaId, tiposCita]);
  const selectedTipoCita = useMemo(
    () => tiposCitaDisponibles.find((tipo) => tipo.id === selectedTipoCitaId) ?? null,
    [selectedTipoCitaId, tiposCitaDisponibles],
  );
  const selectedTipoArea = selectedTipoCita ? normalizeCitaArea(selectedTipoCita.area) : null;
  const selectedAreaPresentation = selectedTipoCita
    ? getCitaAreaPresentation(selectedTipoCita.area)
    : null;
  const tiposCitaResultados = useMemo(() => {
    const query = normalizeSearchValue(tipoSearch);
    return tiposCitaDisponibles
      .filter((tipo) => {
        if (!query) return true;
        const area = normalizeCitaArea(tipo.area);
        return (
          normalizeSearchValue(tipo.nombre).includes(query) ||
          normalizeSearchValue(AREA_META[area].label).includes(query) ||
          normalizeSearchValue(AREA_META[area].shortLabel).includes(query)
        );
      })
      .sort((a, b) => {
        const areaDelta =
          AREA_ORDER.indexOf(normalizeCitaArea(a.area)) - AREA_ORDER.indexOf(normalizeCitaArea(b.area));
        if (areaDelta !== 0) return areaDelta;
        return Number(a.is_disabled) - Number(b.is_disabled) || a.nombre.localeCompare(b.nombre, "es");
      })
      .slice(0, 6);
  }, [tipoSearch, tiposCitaDisponibles]);

  const [isEndDateManual, setIsEndDateManual] = useState(false);

  useEffect(() => {
    async function fetchMascotas() {
      if (!selectedClienteId) {
        setMascotas([]);
        return;
      }
      setLoadingMascotas(true);
      const { data, error } = await getMascotasDeCliente(selectedClienteId);
      setLoadingMascotas(false);

      if (error) {
        toast.error("Error al cargar mascotas");
        return;
      }
      if (data) {
        setMascotas(data);
        const currentMascota = form.getValues("mascota_id");
        if (currentMascota && !data.find((m) => m.id === currentMascota)) {
          form.resetField("mascota_id", { defaultValue: "" });
        }
      }
    }
    fetchMascotas();
  }, [selectedClienteId, form]);

  useEffect(() => {
    if (selectedTipoCitaId && selectedStartDate && !isEndDateManual) {
      const tipo = tiposCitaDisponibles.find((t) => t.id === selectedTipoCitaId);
      if (tipo) {
        const start = new Date(selectedStartDate);
        if (!isNaN(start.getTime())) {
          const end = addMinutes(start, tipo.duracion_min);
          form.setValue("end_date", format(end, "yyyy-MM-dd'T'HH:mm"));
        }
      }
    }
  }, [selectedTipoCitaId, selectedStartDate, tiposCitaDisponibles, form, isEndDateManual]);

  async function onSubmit(data: CitaInput) {
    setIsSubmitting(true);
    const { error } = citaId ? await updateCita(citaId, data) : await createCita(data);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(citaId ? "Cita actualizada exitosamente" : "Cita creada exitosamente");
    form.reset({
      cliente_id: safeInitialClienteId,
      mascota_id: initialValues?.mascota_id || "",
      tipo_cita_id: initialValues?.tipo_cita_id || "",
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      notas_text: initialValues?.notas_text ?? "",
    });
    router.refresh();
    if (onSuccess) onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full min-w-0 space-y-3 overflow-x-hidden">
        <FormField
          control={form.control}
          name="cliente_id"
          render={({ field }) => (
            <FormItem className={sectionClass}>
              <FormLabel className={sectionTitleClass}>Responsable</FormLabel>
              <div className="min-w-0 space-y-2 overflow-x-hidden">
                <FormControl>
                  <div className="relative min-w-0">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={clienteSearch}
                      onChange={(event) => setClienteSearch(event.target.value)}
                      placeholder="Buscar responsable, telefono, email, paciente o codigo"
                      className="w-full min-w-0 pl-8"
                    />
                  </div>
                </FormControl>

                {selectedCliente ? (
                  <div className="flex min-w-0 items-start justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{selectedCliente.nombre}</p>
                      {(selectedCliente.telefono || selectedCliente.email) && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[selectedCliente.telefono, selectedCliente.email].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      {selectedClienteDocumento && (
                        <p className="truncate text-[11px] font-medium text-muted-foreground">
                          {selectedClienteDocumento}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={() => {
                        field.onChange("");
                        form.resetField("mascota_id", { defaultValue: "" });
                        setMascotas([]);
                        setClienteSearch("");
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : null}

                {(clienteSearch.trim() || !field.value) && (
                  <div className={cn("max-h-48 overflow-y-auto rounded-md border bg-background", hiddenScrollbarClass)}>
                    {clienteSearchResults.length === 0 ? (
                      <div className="space-y-1.5 px-3 py-3 text-center">
                        <p className="text-xs text-muted-foreground">
                          No se encontraron responsables o pacientes.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {clienteSearchResults.map((result) => {
                          const cliente = result.cliente;
                          const autoMascotaId =
                            !result.matchesCliente && result.matchingMascotas.length === 1
                              ? result.matchingMascotas[0].id
                              : null;

                          return (
                            <button
                              key={cliente.id}
                              type="button"
                              className="block w-full min-w-0 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                              onClick={() => {
                                field.onChange(cliente.id);
                                form.clearErrors("cliente_id");
                                setMascotas(cliente.mascotas ?? []);
                                setClienteSearch("");

                                if (autoMascotaId) {
                                  form.setValue("mascota_id", autoMascotaId, { shouldValidate: true });
                                  form.clearErrors("mascota_id");
                                  return;
                                }

                                form.resetField("mascota_id", { defaultValue: "" });
                              }}
                            >
                              <div className="flex min-w-0 items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">{cliente.nombre}</p>
                                  {(cliente.telefono || cliente.email) && (
                                    <p className="truncate text-[11px] text-muted-foreground">
                                      {[cliente.telefono, cliente.email].filter(Boolean).join(" / ")}
                                    </p>
                                  )}
                                  {formatClienteDocumento(cliente.tipo_documento_text, cliente.numero_documento_text) && (
                                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                                      {formatClienteDocumento(cliente.tipo_documento_text, cliente.numero_documento_text)}
                                    </p>
                                  )}
                                </div>
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0 text-[9px] font-medium uppercase text-muted-foreground">
                                  Responsable
                                </span>
                              </div>

                              {result.mascotas.length > 0 ? (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {result.mascotas.slice(0, 3).map((mascota) => (
                                    <span
                                      key={mascota.id}
                                      className={cn(
                                        "inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-1.5 py-0 text-[11px]",
                                        autoMascotaId === mascota.id
                                          ? "border-primary/40 bg-primary/5 text-primary"
                                          : "bg-background text-muted-foreground",
                                      )}
                                    >
                                      <span className="truncate">{mascota.nombre}</span>
                                      {mascota.codigo_text?.trim() ? (
                                        <span className="shrink-0 font-semibold">#{mascota.codigo_text}</span>
                                      ) : null}
                                    </span>
                                  ))}
                                  {result.mascotas.length > 3 ? (
                                    <span className="rounded-full bg-muted px-1.5 py-0 text-[11px] text-muted-foreground">
                                      +{result.mascotas.length - 3} mas
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-muted-foreground">Sin pacientes registrados.</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Link href="/clientes/nuevo" className="inline-flex w-fit text-xs font-medium text-primary hover:underline">
                  Crear cliente nuevo
                </Link>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mascota_id"
          render={({ field }) => (
            <FormItem className={sectionClass}>
              <FormLabel className={sectionTitleClass}>Paciente</FormLabel>
              <FormControl>
                <div className={cn("grid max-h-32 min-w-0 grid-cols-1 gap-1.5 overflow-y-auto rounded-md bg-background p-1.5 sm:grid-cols-2", hiddenScrollbarClass)}>
                  {loadingMascotas ? (
                    <div className="col-span-full flex items-center justify-center rounded-md bg-muted/20 p-3">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Cargando...</span>
                    </div>
                  ) : !selectedClienteId ? (
                    <div className="col-span-full rounded-md border border-dashed bg-muted/10 p-3 text-center">
                      <p className="text-xs text-muted-foreground italic">Selecciona un responsable primero</p>
                    </div>
                  ) : mascotas.length === 0 ? (
                    <div className="col-span-full rounded-md border border-dashed border-destructive/20 bg-destructive/5 p-3 text-center">
                      <p className="text-xs text-destructive">El responsable no tiene pacientes</p>
                    </div>
                  ) : (
                    mascotas.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          field.onChange(m.id);
                          form.clearErrors("mascota_id");
                        }}
                        className={cn(
                          "relative flex min-h-14 min-w-0 flex-col items-start rounded-md border p-2 text-left transition-all",
                          "hover:border-primary/50 hover:bg-accent/50",
                          field.value === m.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                            : "border-input bg-background"
                        )}
                      >
                        <span className={cn(
                          "w-full truncate text-sm font-semibold",
                          field.value === m.id ? "text-primary" : "text-foreground"
                        )}>
                          {m.nombre}
                        </span>
                        {m.codigo_text?.trim() ? (
                          <span className="mt-1 text-[10px] font-semibold text-muted-foreground">
                            #{m.codigo_text}
                          </span>
                        ) : null}
                        <span className="mt-1 text-[10px] font-medium uppercase text-muted-foreground">
                          Paciente
                        </span>
                        {field.value === m.id && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_cita_id"
          render={({ field }) => (
            <FormItem className={sectionClass}>
              <FormLabel className={sectionTitleClass}>Tipo de Cita</FormLabel>
              <FormControl>
                <div className="min-w-0 space-y-2 overflow-x-hidden">
                  <div className="relative min-w-0">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={tipoSearch}
                      onChange={(event) => setTipoSearch(event.target.value)}
                      placeholder="Buscar tipo o area"
                      className="w-full min-w-0 pl-8"
                    />
                  </div>

                  {selectedTipoCita ? (
                    <div className="flex min-w-0 items-start justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{getTipoCitaLabel(selectedTipoCita)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={() => {
                          field.onChange("");
                          setTipoSearch("");
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : null}

                  {tipoSearch.trim() || !field.value ? (
                    <div className={cn("max-h-48 overflow-y-auto rounded-md border bg-background p-1", hiddenScrollbarClass)}>
                      {tiposCitaResultados.length === 0 ? (
                        <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                          Sin tipos para la busqueda.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {tiposCitaResultados.map((tipo) => {
                            const area = normalizeCitaArea(tipo.area);

                            return (
                              <button
                                key={tipo.id}
                                type="button"
                                className={cn(
                                  "flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
                                  field.value === tipo.id ? "bg-primary/5 text-primary" : "text-foreground",
                                )}
                                onClick={() => {
                                  field.onChange(tipo.id);
                                  form.trigger("tipo_cita_id");
                                  setTipoSearch("");
                                }}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">
                                    {tipo.nombre}{tipo.is_disabled ? " (inactivo)" : ""}
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    {AREA_META[area].label} - {tipo.duracion_min} min
                                  </span>
                                </span>
                                <span className="shrink-0 rounded-full border px-1.5 py-0 text-[10px] text-muted-foreground">
                                  {AREA_META[area].shortLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </FormControl>
              <FormMessage />
              {selectedTipoCita && selectedAreaPresentation ? (
                <div className={cn("mt-2 min-w-0 overflow-hidden rounded-md border px-2.5 py-1.5 text-xs", selectedAreaPresentation.panelClass)}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", selectedAreaPresentation.dotClass)} />
                    <span className="font-semibold">Area: {selectedAreaPresentation.label}</span>
                  </div>
                  <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                    <p className="min-w-0 truncate">
                      <span className="font-semibold">Tipo:</span> {selectedTipoCita.nombre}
                    </p>
                    <p>
                      <span className="font-semibold">Duracion:</span> {selectedTipoCita.duracion_min} min
                    </p>
                  </div>
                  {selectedTipoArea === "movilidad" ? (
                    <p className="mt-1.5 border-t border-current/20 pt-1.5">
                      Usa las notas de cita para direccion, referencia, horario de recojo o indicaciones de traslado.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </FormItem>
          )}
        />

        <div className={sectionClass}>
          <p className={sectionTitleClass}>Horario</p>
          <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Fecha y Hora de Inicio</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" className="w-full min-w-0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Fecha y Hora de Fin</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="w-full min-w-0"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setIsEndDateManual(true);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notas_text"
          render={({ field }) => (
            <FormItem className={sectionClass}>
              <FormLabel className={sectionTitleClass}>Notas de cita</FormLabel>
              <FormControl>
                <Textarea
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  rows={3}
                  className="min-w-0 resize-none"
                  placeholder="Ej: cuidado con orejas, otitis, temperamento, direccion para movilidad u observaciones para grooming."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cita
        </Button>
      </form>
    </Form>
  );
}
