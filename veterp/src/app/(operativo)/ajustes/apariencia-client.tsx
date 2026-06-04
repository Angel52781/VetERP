"use client";

import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Check, Loader2, Palette, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildClinicThemeStyle,
  normalizeBrandColor,
  themePresetOptions,
  type ThemePreset,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

import {
  createClinicaTemaGuardado,
  deleteClinicaTemaGuardado,
  updateClinicaApariencia,
  type ClinicaTemaGuardado,
} from "./actions";

type AparienciaData = {
  theme_preset_text: ThemePreset;
  brand_color_text: string | null;
};

type AparienciaClientProps = {
  apariencia: AparienciaData | null;
  temasGuardados: ClinicaTemaGuardado[];
  canEdit: boolean;
  loadError?: string | null;
};

const DEFAULT_APARIENCIA: AparienciaData = {
  theme_preset_text: "default",
  brand_color_text: null,
};

function getPresetOption(preset: ThemePreset) {
  return themePresetOptions.find((option) => option.value === preset) ?? themePresetOptions[0];
}

function normalizeSavedAppearance(apariencia: AparienciaData | null): AparienciaData {
  return {
    theme_preset_text: apariencia?.theme_preset_text ?? DEFAULT_APARIENCIA.theme_preset_text,
    brand_color_text: normalizeBrandColor(apariencia?.brand_color_text) ?? DEFAULT_APARIENCIA.brand_color_text,
  };
}

export function AparienciaClient({ apariencia, temasGuardados, canEdit, loadError }: AparienciaClientProps) {
  const router = useRouter();
  const initial = normalizeSavedAppearance(apariencia);
  const [saved, setSaved] = useState<AparienciaData>(initial);
  const [savedThemes, setSavedThemes] = useState<ClinicaTemaGuardado[]>(temasGuardados);
  const [preset, setPreset] = useState<ThemePreset>(initial.theme_preset_text);
  const [hexValue, setHexValue] = useState(initial.brand_color_text ?? "");
  const [themeName, setThemeName] = useState("");
  const [previewedThemeId, setPreviewedThemeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null);

  const normalizedHex = normalizeBrandColor(hexValue);
  const hasHexInput = hexValue.trim().length > 0;
  const hexIsInvalid = hasHexInput && !normalizedHex;
  const activePreset = getPresetOption(preset);
  const activePresetColor = activePreset.color;
  const colorPickerValue = normalizedHex ?? activePresetColor;
  const isBusy = isSaving || isSavingTheme || pendingThemeId != null;
  const inputsDisabled = isBusy || !canEdit;
  const currentBrandColor = hexIsInvalid ? saved.brand_color_text : normalizedHex;
  const hasChanges = preset !== saved.theme_preset_text || currentBrandColor !== saved.brand_color_text;
  const savedIsDefault = saved.theme_preset_text === "default" && saved.brand_color_text == null;
  const previewIsDefault = preset === "default" && !normalizedHex;
  const activeColorText = normalizedHex
    ? `${normalizedHex} (personalizado)`
    : `${activePreset.label} ${activePresetColor} (preset)`;
  const themeColorToSave = normalizedHex ?? activePresetColor;
  const savedThemeCount = savedThemes.length;
  const canSaveMoreThemes = savedThemeCount < 10;
  const previewedTheme = previewedThemeId
    ? savedThemes.find((theme) => theme.id === previewedThemeId) ?? null
    : null;

  const previewStyle = useMemo(
    () =>
      buildClinicThemeStyle({
        theme_preset_text: preset,
        brand_color_text: normalizedHex,
      }) as CSSProperties,
    [preset, normalizedHex],
  );

  function selectPreset(nextPreset: ThemePreset) {
    setPreset(nextPreset);
    setHexValue("");
    setPreviewedThemeId(null);
  }

  function setCustomColor(value: string) {
    setHexValue(value.toUpperCase());
    setPreviewedThemeId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      toast.error("Solo administradores pueden modificar la apariencia.");
      return;
    }

    if (!hasChanges) {
      return;
    }

    if (hexIsInvalid) {
      toast.error("Usa un color HEX valido en formato #RRGGBB.");
      return;
    }

    setIsSaving(true);
    const result = await updateClinicaApariencia({
      theme_preset_text: preset,
      brand_color_text: normalizedHex,
    });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const nextSaved = normalizeSavedAppearance({
      theme_preset_text: (result.data?.theme_preset_text ?? preset) as ThemePreset,
      brand_color_text: result.data?.brand_color_text ?? normalizedHex,
    });

    setSaved(nextSaved);
    setPreset(nextSaved.theme_preset_text);
    setHexValue(nextSaved.brand_color_text ?? "");
    setPreviewedThemeId(null);
    toast.success("Apariencia actualizada.");
    router.refresh();
  }

  function handleRestore() {
    if (!canEdit) {
      toast.error("Solo administradores pueden modificar la apariencia.");
      return;
    }

    setPreset("default");
    setHexValue("");
    setPreviewedThemeId(null);
    toast.message("Predeterminado en vista previa. Pulsa Guardar apariencia para activarlo.");
  }

  async function handleSaveTheme() {
    if (!canEdit) {
      toast.error("Solo administradores pueden modificar la apariencia.");
      return;
    }

    if (!canSaveMoreThemes) {
      toast.error("Solo puedes guardar hasta 10 temas.");
      return;
    }

    if (hexIsInvalid) {
      toast.error("El color debe tener formato #RRGGBB.");
      return;
    }

    const name = themeName.trim();
    if (!name) {
      toast.error("El nombre del tema es obligatorio.");
      return;
    }

    setIsSavingTheme(true);
    const result = await createClinicaTemaGuardado({
      nombre_text: name,
      theme_preset_text: preset,
      brand_color_text: themeColorToSave,
      orden_int: savedThemeCount,
    });
    setIsSavingTheme(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.data) {
      setSavedThemes((current) => [...current, result.data as ClinicaTemaGuardado]);
    }
    setThemeName("");
    toast.success("Tema guardado");
    router.refresh();
  }

  function handlePreviewTheme(theme: ClinicaTemaGuardado) {
    if (!canEdit) {
      toast.error("Solo administradores pueden modificar la apariencia.");
      return;
    }

    const nextPreview = normalizeSavedAppearance({
      theme_preset_text: theme.theme_preset_text,
      brand_color_text: theme.brand_color_text,
    });

    setPreset(nextPreview.theme_preset_text);
    setHexValue(nextPreview.brand_color_text ?? "");
    setPreviewedThemeId(theme.id);
    toast.message("Tema en vista previa. Pulsa Guardar apariencia para activarlo.");
  }

  async function handleDeleteTheme(theme: ClinicaTemaGuardado) {
    if (!canEdit) {
      toast.error("Solo administradores pueden modificar la apariencia.");
      return;
    }

    const confirmed = window.confirm(
      `Eliminar el tema "${theme.nombre_text}"? Esta accion no se puede deshacer.`,
    );
    if (!confirmed) {
      return;
    }

    setPendingThemeId(theme.id);
    const result = await deleteClinicaTemaGuardado(theme.id);
    setPendingThemeId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setSavedThemes((current) => current.filter((item) => item.id !== theme.id));
    if (previewedThemeId === theme.id) {
      setPreviewedThemeId(null);
    }
    toast.success("Tema eliminado");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        {loadError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
          </div>
        ) : null}

        {!canEdit ? (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Solo administradores pueden modificar la apariencia.
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Tema visual</CardTitle>
            <CardDescription>Se aplicara a todos los usuarios de esta clinica.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {themePresetOptions.map((option) => {
                const active = option.value === preset;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-24 items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      "hover:border-primary/50 hover:bg-primary/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background",
                    )}
                    onClick={() => selectPreset(option.value)}
                    disabled={inputsDisabled}
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                      style={{ backgroundColor: option.color, borderColor: "var(--border)" }}
                    >
                      {active ? <Check className="h-4 w-4 text-white drop-shadow" /> : null}
                    </span>
                    <span className="min-w-0 space-y-1">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs leading-5 text-muted-foreground">{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color principal</CardTitle>
            <CardDescription>
              El color personalizado reemplaza el acento del preset hasta que lo quites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="brand-color-picker">Color</Label>
                <Input
                  id="brand-color-picker"
                  type="color"
                  className="h-10 w-16 p-1"
                  value={colorPickerValue}
                  onChange={(event) => setCustomColor(event.target.value)}
                  disabled={inputsDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-color-hex">HEX</Label>
                <Input
                  id="brand-color-hex"
                  value={hexValue}
                  onChange={(event) => setCustomColor(event.target.value)}
                  placeholder="#2563EB"
                  aria-invalid={hexIsInvalid}
                  disabled={inputsDisabled}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHexValue("");
                  setPreviewedThemeId(null);
                }}
                disabled={inputsDisabled || !hasHexInput}
              >
                Volver al color del preset
              </Button>
            </div>

            {hexIsInvalid ? (
              <p className="text-sm text-destructive">
                Usa un color HEX valido en formato #RRGGBB. La vista previa usa el preset hasta que el HEX sea valido.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Color activo: {activeColorText}</span>
                {normalizedHex ? <Badge variant="outline">Color personalizado activo</Badge> : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Temas guardados</CardTitle>
                <CardDescription>
                  Haz clic en un tema guardado para previsualizarlo. Luego pulsa Guardar apariencia para activarlo en la clinica.
                </CardDescription>
              </div>
              <Badge variant="outline">{savedThemeCount}/10 temas guardados</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedThemes.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                Aun no hay temas guardados. Personaliza un color y guardalo para reutilizarlo.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {savedThemes.map((theme) => {
                  const themePreset = getPresetOption(theme.theme_preset_text);
                  const isPendingTheme = pendingThemeId === theme.id;
                  const isPreviewedTheme = previewedThemeId === theme.id;

                  return (
                    <div
                      key={theme.id}
                      role={canEdit ? "button" : undefined}
                      tabIndex={inputsDisabled || isPendingTheme ? -1 : 0}
                      aria-pressed={isPreviewedTheme}
                      aria-disabled={inputsDisabled || isPendingTheme}
                      onClick={() => {
                        if (!inputsDisabled && !isPendingTheme) {
                          handlePreviewTheme(theme);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (inputsDisabled || isPendingTheme) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handlePreviewTheme(theme);
                        }
                      }}
                      className={cn(
                        "rounded-xl border bg-card p-3 text-left shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        inputsDisabled || isPendingTheme ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                        isPreviewedTheme ? "border-primary bg-primary/5" : "border-border",
                      )}
                      style={{ borderColor: isPreviewedTheme ? "var(--brand)" : "var(--brand-border)" }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 h-10 w-10 shrink-0 rounded-xl border shadow-inner"
                          style={{ backgroundColor: theme.brand_color_text }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">{theme.nombre_text}</p>
                            {isPreviewedTheme ? <Badge variant="outline">En vista previa</Badge> : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {themePreset.label} · {theme.brand_color_text}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteTheme(theme);
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          disabled={inputsDisabled || isPendingTheme}
                        >
                          {isPendingTheme ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="saved-theme-name">Nombre del tema</Label>
                  <Input
                    id="saved-theme-name"
                    value={themeName}
                    onChange={(event) => setThemeName(event.target.value)}
                    placeholder="Ej. Azul recepcion"
                    maxLength={40}
                    disabled={inputsDisabled || !canSaveMoreThemes}
                  />
                  <p className="text-xs text-muted-foreground">
                    Guarda la combinacion actual para reutilizarla despues. Se guardara {themeColorToSave} desde{" "}
                    {normalizedHex ? "el color personalizado actual" : "el color activo del preset"}.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleSaveTheme}
                  disabled={inputsDisabled || !canSaveMoreThemes || hexIsInvalid}
                >
                  {isSavingTheme ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Guardar como tema
                </Button>
              </div>

              {!canSaveMoreThemes ? (
                <p className="mt-3 text-sm text-muted-foreground">Solo puedes guardar hasta 10 temas.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {hasChanges ? <Badge>Cambios sin guardar</Badge> : <Badge variant="outline">Sin cambios pendientes</Badge>}
            {previewedTheme ? (
              <span>Previsualizando: {previewedTheme.nombre_text}</span>
            ) : hasChanges ? (
              <span>Previsualizando cambios.</span>
            ) : (
              <span>La apariencia guardada esta activa.</span>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleRestore}
              disabled={inputsDisabled || (savedIsDefault && previewIsDefault && !hasChanges)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar predeterminado
            </Button>
            <Button type="submit" disabled={inputsDisabled || hexIsInvalid || !hasChanges}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar apariencia
            </Button>
          </div>
        </div>
      </div>

      <Card style={previewStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Vista previa
          </CardTitle>
          <CardDescription>
            Preset: {activePreset.label}. Color activo: {activeColorText}.
            {hasChanges ? " Cambios sin guardar." : " Apariencia guardada activa."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-lg border p-3"
            style={{
              backgroundColor: "var(--brand-sidebar-surface)",
              borderColor: "var(--brand-border)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                V
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Clinica VetERP</p>
                <p className="text-xs text-muted-foreground">Sede Activa</p>
              </div>
            </div>
            <div className="space-y-2">
              <div
                className="rounded-md px-2 py-1.5 text-sm font-medium"
                style={{ backgroundColor: "var(--brand-sidebar-active)", color: "var(--brand)" }}
              >
                Navegacion activa
              </div>
              <div className="rounded-md px-2 py-1.5 text-sm text-muted-foreground">Clientes</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button">Primario</Button>
            <Button type="button" variant="outline">
              Outline
            </Button>
            <Badge>Badge</Badge>
          </div>

          <div
            className="rounded-lg border bg-card p-3"
            style={{ borderColor: "var(--brand-border)", boxShadow: "inset 3px 0 0 var(--brand)" }}
          >
            <p className="mb-1 text-sm font-medium">Card de ejemplo</p>
            <p className="text-sm text-muted-foreground">Texto secundario y superficie neutra.</p>
          </div>

          <div
            className="flex h-8 items-center rounded-lg border bg-background px-2.5 text-sm"
            style={{
              borderColor: "var(--ring)",
              boxShadow: "0 0 0 3px color-mix(in srgb, var(--ring) 25%, transparent)",
            }}
          >
            Input enfocado
          </div>

          <a href="#apariencia-preview" className="inline-flex text-sm font-medium text-primary hover:underline">
            Link con acento
          </a>
        </CardContent>
      </Card>
    </form>
  );
}
