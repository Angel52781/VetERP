import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad - VetERP",
  description: "Políticas de privacidad y manejo de datos de VetERP.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#FFFEFB] text-[#263238] font-sans selection:bg-[#DDEDEA]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFFEFB]/80 backdrop-blur-md border-b border-[#D7DEDA]/50">
        <div className="max-w-[1180px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg text-[#0F766E] flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Volver
          </Link>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[#0F766E] font-semibold tracking-[0.2em] text-[11px] uppercase">Privacidad</span>
          <div className="h-[1px] w-12 bg-[#0F766E]/50"></div>
        </div>
        <h1 className="text-4xl font-semibold mb-10">Política de Privacidad</h1>
        
        <div className="space-y-6 text-[#64706F] leading-relaxed text-lg">
          <p>
            VetERP está diseñado para manejar información operativa y clínica con cuidado. Durante la beta privada, 
            el acceso se habilita de forma controlada y progresiva.
          </p>
          <p>
            Nos tomamos muy en serio la seguridad de los datos de su clínica veterinaria, incluyendo la 
            información de pacientes, historiales clínicos, agenda y facturación.
          </p>
          <h2 className="text-2xl font-semibold text-[#263238] mt-10 mb-4">Uso de la información</h2>
          <p>
            La información ingresada al sistema se utiliza exclusivamente para proveer el servicio operativo 
            de su clínica. OrbitalFrameworks no comparte ni comercializa datos clínicos o financieros con terceros.
          </p>
          <h2 className="text-2xl font-semibold text-[#263238] mt-10 mb-4">Fase Beta Privada</h2>
          <p>
            Al utilizar VetERP durante su fase beta, usted comprende que el sistema se encuentra en evaluación 
            y optimización continua.
          </p>
        </div>
      </main>
    </div>
  );
}
