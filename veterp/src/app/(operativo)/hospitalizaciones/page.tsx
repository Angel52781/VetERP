import { BedDouble, Clock, Stethoscope } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata = {
  title: "Hospitalizaciones | VetERP",
  description: "Pacientes internados, evolución, medicación y alta",
};

export default function HospitalizacionesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BedDouble className="h-6 w-6 text-primary" />
          Hospitalizaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Pacientes internados, evolución clínica, medicación y alta.
        </p>
      </div>

      {/* Roadmap notice */}
      <Card className="border-dashed">
        <CardHeader className="pb-2 flex flex-row items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <CardTitle className="text-base">Módulo en roadmap</CardTitle>
            <CardDescription className="mt-1">
              Próxima fase después de Recepción y Paciente 360.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El módulo de Hospitalizaciones incluirá:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-none">
            {[
              "Vista de jaulas / camas activas con paciente asignado",
              "Registro diario de evolución clínica",
              "Hoja de medicación con dosis y horarios",
              "Registro de signos vitales periódicos",
              "Alta médica y resumen de internamiento",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Stethoscope className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/60" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Placeholder visual */}
      <div className="rounded-lg border border-dashed p-16 flex flex-col items-center justify-center text-center gap-4">
        <BedDouble className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <p className="font-medium text-muted-foreground">Sin pacientes internados</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Este módulo estará disponible en una próxima fase de desarrollo.
          </p>
        </div>
      </div>
    </div>
  );
}
