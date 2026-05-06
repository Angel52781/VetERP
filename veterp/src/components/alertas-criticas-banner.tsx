import { AlertTriangle } from "lucide-react";

interface AlertasCriticasBannerProps {
  alertas: string | null | undefined;
}

/**
 * Muestra un banner de advertencia rojo si el paciente tiene alertas críticas.
 * Renderiza null si el campo está vacío — nunca deja espacio en blanco.
 */
export function AlertasCriticasBanner({ alertas }: AlertasCriticasBannerProps) {
  const texto = alertas?.trim();
  if (!texto) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug">Alerta importante del paciente</p>
        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{texto}</p>
      </div>
    </div>
  );
}
