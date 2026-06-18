export const themePresetValues = [
  "default",
  "blue",
  "green",
  "purple",
  "warm",
  "high_contrast",
] as const;

export type ThemePreset = (typeof themePresetValues)[number];

export type ThemePresetOption = {
  value: ThemePreset;
  label: string;
  description: string;
  color: string;
};

export const themePresetOptions: readonly ThemePresetOption[] = [
  {
    value: "default",
    label: "Predeterminado",
    description: "Neutral y sobrio.",
    color: "#171717",
  },
  {
    value: "blue",
    label: "Azul",
    description: "Clinico y confiable.",
    color: "#2563EB",
  },
  {
    value: "green",
    label: "Verde",
    description: "Calmo y natural.",
    color: "#047857",
  },
  {
    value: "purple",
    label: "Morado",
    description: "Moderno y distintivo.",
    color: "#7C3AED",
  },
  {
    value: "warm",
    label: "Calido",
    description: "Cercano y amable.",
    color: "#C2410C",
  },
  {
    value: "high_contrast",
    label: "Alto contraste",
    description: "Maxima claridad.",
    color: "#000000",
  },
];

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const DARK_FOREGROUND = "#111827";
const LIGHT_FOREGROUND = "#FFFFFF";

type ThemeTokenSet = {
  preset: ThemePreset;
  primary: string;
  primaryForeground: string;
  ring: string;
  brandSoft: string;
  brandBorder: string;
  brandHover: string;
};

export type ClinicThemeInput = {
  theme_preset_text?: string | null;
  brand_color_text?: string | null;
};

export type SavedThemeInput = {
  nombre_text?: unknown;
  theme_preset_text?: unknown;
  brand_color_text?: unknown;
  orden_int?: unknown;
};

export type ValidSavedThemeInput = {
  nombre_text: string;
  theme_preset_text: ThemePreset;
  brand_color_text: string;
  orden_int: number;
};

export type SavedThemeValidationResult =
  | { success: true; data: ValidSavedThemeInput }
  | { success: false; error: string };

export function isThemePreset(value: unknown): value is ThemePreset {
  return typeof value === "string" && themePresetValues.includes(value as ThemePreset);
}

export function normalizeThemePreset(value: unknown): ThemePreset {
  return isThemePreset(value) ? value : "default";
}

export function normalizeBrandColor(value: unknown): string | null {
  if (value == null || typeof value !== "string") {
    return null;
  }

  const color = value.trim();
  if (!color) {
    return null;
  }

  if (!HEX_COLOR_PATTERN.test(color)) {
    return null;
  }

  return color.toUpperCase();
}

export function validateSavedThemeInput(input: SavedThemeInput): SavedThemeValidationResult {
  const nombre = typeof input.nombre_text === "string" ? input.nombre_text.trim() : "";
  if (!nombre) {
    return { success: false, error: "El nombre del tema es obligatorio." };
  }

  if (nombre.length > 40) {
    return { success: false, error: "El nombre del tema no puede superar 40 caracteres." };
  }

  if (!isThemePreset(input.theme_preset_text)) {
    return { success: false, error: "Selecciona un tema valido." };
  }

  const brandColor = normalizeBrandColor(input.brand_color_text);
  if (!brandColor) {
    return { success: false, error: "El color debe tener formato #RRGGBB." };
  }

  const rawOrder = input.orden_int == null ? 0 : Number(input.orden_int);
  const order = Number.isFinite(rawOrder) ? Math.trunc(rawOrder) : 0;
  if (order < 0) {
    return { success: false, error: "El orden del tema no puede ser negativo." };
  }

  return {
    success: true,
    data: {
      nombre_text: nombre,
      theme_preset_text: input.theme_preset_text,
      brand_color_text: brandColor,
      orden_int: order,
    },
  };
}

function hexToRgb(hex: string) {
  const normalized = normalizeBrandColor(hex);
  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function srgbToLinear(value: number) {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }

  return (
    0.2126 * srgbToLinear(rgb.r) +
    0.7152 * srgbToLinear(rgb.g) +
    0.0722 * srgbToLinear(rgb.b)
  );
}

export function getContrastRatio(hexA: string, hexB: string): number | null {
  const luminanceA = getRelativeLuminance(hexA);
  const luminanceB = getRelativeLuminance(hexB);

  if (luminanceA == null || luminanceB == null) {
    return null;
  }

  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastForeground(hex: string): string {
  const whiteContrast = getContrastRatio(hex, LIGHT_FOREGROUND) ?? 0;
  const darkContrast = getContrastRatio(hex, DARK_FOREGROUND) ?? 0;

  return whiteContrast >= darkContrast ? LIGHT_FOREGROUND : DARK_FOREGROUND;
}

function getPresetColor(preset: ThemePreset) {
  return themePresetOptions.find((option) => option.value === preset)?.color ?? "#171717";
}

function colorMix(color: string, colorPercent: number, target: "white" | "black") {
  return `color-mix(in srgb, ${color} ${colorPercent}%, ${target})`;
}

export function resolveClinicTheme(input: ClinicThemeInput): ThemeTokenSet {
  const preset = normalizeThemePreset(input.theme_preset_text);
  const customColor = normalizeBrandColor(input.brand_color_text);
  const primary = customColor ?? getPresetColor(preset);
  const primaryForeground = getContrastForeground(primary);

  return {
    preset,
    primary,
    primaryForeground,
    ring: primary,
    brandSoft: colorMix(primary, 10, "white"),
    brandBorder: colorMix(primary, 28, "white"),
    brandHover: colorMix(primary, 84, "black"),
  };
}

export function buildClinicThemeStyle(input: ClinicThemeInput): Record<`--${string}`, string> {
  const tokens = resolveClinicTheme(input);

  return {
    "--brand": tokens.primary,
    "--brand-foreground": tokens.primaryForeground,
    "--brand-hover": tokens.brandHover,
    "--brand-soft": tokens.brandSoft,
    "--brand-border": tokens.brandBorder,
    "--brand-surface": colorMix(tokens.primary, 6, "white"),
    "--brand-sidebar-surface": colorMix(tokens.primary, 8, "white"),
    "--brand-sidebar-active": colorMix(tokens.primary, 14, "white"),
    "--brand-ring": tokens.ring,
    "--primary": tokens.primary,
    "--primary-foreground": tokens.primaryForeground,
    "--ring": tokens.ring,
    "--sidebar-primary": tokens.primary,
    "--sidebar-primary-foreground": tokens.primaryForeground,
    "--sidebar-ring": tokens.ring,
  };
}
