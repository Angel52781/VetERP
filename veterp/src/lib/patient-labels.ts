export const SPECIES_OPTIONS = [
  { value: "Canino", label: "Canino" },
  { value: "Felino", label: "Felino" },
  { value: "Lagomorfo", label: "Lagomorfo" },
] as const;

export function formatSpeciesLabel(value: string | null | undefined) {
  if (!value) return "Sin especie";

  const normalized = value.trim().toLowerCase();
  if (normalized === "perro" || normalized === "canino") return "Canino";
  if (normalized === "gato" || normalized === "felino") return "Felino";
  if (normalized === "conejo" || normalized === "lagomorfo") return "Lagomorfo";

  return value.trim();
}

export function formatBreedLabel(value: string | null | undefined) {
  return value?.trim() || "Raza no registrada";
}
