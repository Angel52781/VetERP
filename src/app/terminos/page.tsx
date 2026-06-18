import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones - VetERP",
  description: "Términos y condiciones de uso de VetERP.",
};

export default function TerminosPage() {
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
          <span className="text-[#0F766E] font-semibold tracking-[0.2em] text-[11px] uppercase">Términos</span>
          <div className="h-[1px] w-12 bg-[#0F766E]/50"></div>
        </div>
        <h1 className="text-4xl font-semibold mb-10">Términos y Condiciones</h1>
        
        <div className="space-y-6 text-[#64706F] leading-relaxed text-lg">
          <p>
            Al acceder a VetERP durante su fase de beta privada, usted acepta los siguientes términos de servicio.
          </p>
          <p>
            VetERP es una plataforma SaaS diseñada para facilitar la operación diaria de clínicas veterinarias,
            desarrollada por OrbitalFrameworks.
          </p>
          <h2 className="text-2xl font-semibold text-[#263238] mt-10 mb-4">Condiciones de la Beta Privada</h2>
          <p>
            El producto se ofrece "tal cual" y "según disponibilidad" durante esta fase. El acceso se habilita 
            de forma progresiva y puede estar sujeto a cambios en funcionalidad mientras recopilamos feedback 
            operativo para futuras versiones.
          </p>
          <h2 className="text-2xl font-semibold text-[#263238] mt-10 mb-4">Responsabilidad del Usuario</h2>
          <p>
            La clínica usuaria es responsable de mantener la confidencialidad de sus credenciales y de 
            asegurar que el ingreso de datos clínicos y personales cumpla con las normativas locales aplicables.
          </p>
        </div>
      </main>
    </div>
  );
}
