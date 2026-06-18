import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VetERP - Organiza la operación diaria de tu clínica veterinaria",
  description: "Agenda, atención clínica, pacientes, cobros e inventario en un espacio claro y fácil de usar. VetERP está en beta privada y el acceso se habilitará progresivamente.",
};

const CONTACT_EMAIL = "contact.orbitalframeworks@gmail.com";
const MAILTO_LINK = `mailto:${CONTACT_EMAIL}?subject=Solicitud%20de%20demo%20VetERP`;

function BrowserFrame({ children, title = "" }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(38,50,56,0.15)] border border-[#D7DEDA]/80 bg-[#FFFEFB] transition-transform duration-500 hover:-translate-y-1">
      {/* Browser Header */}
      <div className="h-10 bg-[#FFFEFB] border-b border-[#D7DEDA]/40 flex items-center px-4 relative">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
          <div className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
          <div className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
        </div>
        {title && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-medium text-[#64706F]/50 tracking-wide bg-[#F7F4EC] px-3 py-1 rounded-md">{title}</span>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="w-full relative">
        {children}
      </div>
    </div>
  );
}

function SectionEyebrow({ children, centered = false, className = "" }: { children: React.ReactNode, centered?: boolean, className?: string }) {
  if (centered) {
    return (
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        <div className="h-[1px] w-8 sm:w-12 bg-[#0F766E]/50"></div>
        <span className="text-[#0F766E] font-semibold tracking-[0.2em] text-[11px] uppercase whitespace-nowrap">{children}</span>
        <div className="h-[1px] w-8 sm:w-12 bg-[#0F766E]/50"></div>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="text-[#0F766E] font-semibold tracking-[0.2em] text-[11px] uppercase">{children}</span>
      <div className="h-[1px] w-12 bg-[#0F766E]/50"></div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFEFB] text-[#263238] font-sans selection:bg-[#DDEDEA]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFFEFB]/90 backdrop-blur-md border-b border-[#D7DEDA]/40 transition-all">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/veterp-mark-transparent.png"
              alt="VetERP Mark"
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="text-xl font-bold text-[#263238] tracking-tight">VetERP</span>
          </Link>
          <div className="hidden md:flex items-center gap-10 text-[15px] font-medium text-[#64706F]">
            <a href="#producto" className="hover:text-[#0F766E] transition-colors">Producto</a>
            <a href="#flujo" className="hover:text-[#0F766E] transition-colors">Flujo</a>
            <a href="#beta" className="hover:text-[#0F766E] transition-colors">Beta privada</a>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="hidden sm:block text-[14px] font-medium text-[#64706F] hover:text-[#0F766E] transition-colors"
            >
              Iniciar sesión
            </Link>
            <a
              href={MAILTO_LINK}
              className="text-[15px] font-medium text-[#FFFEFB] bg-[#0F766E] hover:bg-[#115E59] shadow-sm transition-all hover:shadow px-6 py-2.5 rounded-full"
            >
              Solicitar demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 max-w-[1200px] mx-auto text-center flex flex-col items-center">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <SectionEyebrow centered>Beta Privada</SectionEyebrow>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.15] font-bold text-[#263238] tracking-tight max-w-[900px] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
          Organiza la operación diaria de tu clínica veterinaria.
        </h1>
        
        <p className="text-lg md:text-xl text-[#64706F] max-w-[800px] mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
          Agenda, atención clínica, pacientes, cobros e inventario en un espacio claro y fácil de usar. 
          VetERP está en beta privada y el acceso se habilitará progresivamente.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
          <a
            href={MAILTO_LINK}
            className="text-base font-medium text-[#FFFEFB] bg-[#0F766E] hover:bg-[#115E59] transition-all hover:shadow-md hover:-translate-y-0.5 px-8 py-4 rounded-full w-full sm:w-auto"
          >
            Solicitar demo
          </a>
          <Link
            href="/login"
            className="text-base font-medium text-[#263238] bg-[#FFFEFB] hover:bg-[#F7F4EC] border border-[#D7DEDA] transition-colors px-8 py-4 rounded-full w-full sm:w-auto"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="flex flex-col items-center gap-2 mb-24 animate-in fade-in duration-1000 delay-700">
          <span className="text-xs font-medium text-[#64706F] uppercase tracking-wider">Una iniciativa de</span>
          <a href="https://orbitalframeworks.qzz.io/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F4EC] border border-[#D7DEDA]/50 hover:border-[#0F766E]/30 transition-all">
            <span className="text-sm font-bold text-[#263238] group-hover:text-[#0F766E] transition-colors">OrbitalFrameworks</span>
          </a>
        </div>

        <div className="w-full max-w-[1080px] mx-auto animate-in zoom-in-95 fade-in duration-1000 delay-1000">
          <BrowserFrame title="veterp.com/app/recepcion">
            <Image
              src="/landing/screenshots/hero-recepcion-dashboard.png"
              alt="Dashboard de recepción de VetERP mostrando pacientes programados y atenciones"
              width={1280}
              height={817}
              quality={100}
              unoptimized
              className="w-full h-auto block"
              priority
            />
          </BrowserFrame>
        </div>
      </section>

      {/* Beneficios */}
      <section id="producto" className="py-32 bg-[#F7F4EC]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-20 max-w-2xl">
            <SectionEyebrow className="mb-6">Producto</SectionEyebrow>
            <h2 className="text-4xl md:text-5xl font-bold text-[#263238] tracking-tight">El contexto que tu equipo necesita, donde lo necesita.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-x-12 gap-y-16">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#DDEDEA] text-[#0F766E] flex items-center justify-center mb-6 shadow-sm">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#263238]">Orden diario</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">Recepción y agenda conectadas para visualizar lo que sigue.</p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#DDEDEA] text-[#0F766E] flex items-center justify-center mb-6 shadow-sm">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#263238]">Continuidad clínica</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">La información del paciente acompaña cada atención.</p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#DDEDEA] text-[#0F766E] flex items-center justify-center mb-6 shadow-sm">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#263238]">Control operativo</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">Cobros y stock visibles sin convertir la experiencia en un sistema pesado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recorrido del producto */}
      <section id="flujo" className="pt-32 pb-20 max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-32 max-w-3xl mx-auto">
          <SectionEyebrow centered className="mb-6">Flujo</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238] tracking-tight">
            Un flujo que acompaña el trabajo de la clínica.
          </h2>
        </div>

        <div className="space-y-40">
          {/* Agenda */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <BrowserFrame title="veterp.com/app/agenda">
                <Image src="/landing/screenshots/feature-agenda-operativa.png" alt="Vista operativa de la agenda con consultas y vacunaciones" width={1280} height={729} quality={100} unoptimized className="w-full h-auto block" />
              </BrowserFrame>
            </div>
            <div className="order-1 lg:order-2 lg:pl-10">
              <h3 className="text-3xl font-bold text-[#263238] mb-6 tracking-tight">Agenda organizada por área</h3>
              <p className="text-xl text-[#64706F] leading-relaxed">Consulta, grooming y otros tipos de cita se ordenan en una vista operativa fácil de recorrer.</p>
            </div>
          </div>

          {/* Historia Clínica */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg:pr-10">
              <h3 className="text-3xl font-bold text-[#263238] mb-6 tracking-tight">La historia del paciente, con continuidad</h3>
              <p className="text-xl text-[#64706F] leading-relaxed">Antecedentes, atenciones y seguimientos reunidos en una línea de tiempo clara.</p>
            </div>
            <div>
              <div className="max-h-[600px] overflow-hidden rounded-xl shadow-[0_20px_50px_-12px_rgba(38,50,56,0.15)] border border-[#D7DEDA]/80 bg-[#FFFEFB] relative transition-transform duration-500 hover:-translate-y-1">
                 <div className="h-10 bg-[#FFFEFB] border-b border-[#D7DEDA]/40 flex items-center px-4 sticky top-0 z-10">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
                      <div className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
                      <div className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[11px] font-medium text-[#64706F]/50 tracking-wide bg-[#F7F4EC] px-3 py-1 rounded-md">veterp.com/app/mascotas</span>
                    </div>
                 </div>
                 <Image src="/landing/screenshots/feature-historia-clinica.png" alt="Historia clínica mostrando antecedentes y atenciones previas en línea de tiempo" width={1280} height={2912} quality={100} unoptimized className="w-full h-auto object-cover object-top block" />
                 {/* Fade out bottom to indicate scrollable content */}
                 <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FFFEFB] to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Hospitalización */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <BrowserFrame title="veterp.com/app/hospitalizaciones">
                <Image src="/landing/screenshots/feature-hospitalizacion-clinica.png" alt="Módulo de hospitalización con tratamientos y controles" width={1280} height={1008} quality={100} unoptimized className="w-full h-auto block" />
              </BrowserFrame>
            </div>
            <div className="order-1 lg:order-2 lg:pl-10">
              <h3 className="text-3xl font-bold text-[#263238] mb-6 tracking-tight">Seguimiento durante la hospitalización</h3>
              <p className="text-xl text-[#64706F] leading-relaxed mb-6">Controles y tratamientos visibles dentro del seguimiento del paciente.</p>
              <span className="text-sm text-[#0F766E] font-medium bg-[#DDEDEA] inline-flex px-4 py-2 rounded-lg">Módulo mostrado con alcance de beta privada.</span>
            </div>
          </div>

          {/* Caja e inventario */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg:pr-10">
              <h3 className="text-3xl font-bold text-[#263238] mb-6 tracking-tight">Caja e inventario como soporte de la operación</h3>
              <p className="text-xl text-[#64706F] leading-relaxed">Cobros, ventas y existencias en vistas separadas y fáciles de revisar.</p>
            </div>
            <div>
              <BrowserFrame title="veterp.com/app/caja">
                <Image src="/landing/screenshots/feature-finanzas-caja.png" alt="Vista del módulo de finanzas y corte de caja" width={1280} height={934} quality={100} unoptimized className="w-full h-auto block" />
              </BrowserFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Nota de privacidad visible */}
      <section className="py-8 bg-[#FFFEFB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-[#F7F4EC] rounded-3xl p-10 border border-[#D7DEDA]/60 text-center shadow-sm">
             <SectionEyebrow centered className="mb-5">Privacidad</SectionEyebrow>
             <p className="text-[#64706F] text-lg leading-relaxed max-w-2xl mx-auto">
               VetERP está diseñado para manejar información operativa y clínica con cuidado. Durante la beta privada, el acceso se habilita de forma controlada.
             </p>
          </div>
        </div>
      </section>

      {/* Beta privada section */}
      <section id="beta" className="pt-20 pb-32 bg-[#DDEDEA]/30 border-y border-[#D7DEDA]/40">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <SectionEyebrow centered className="mb-6">Beta Privada</SectionEyebrow>
          <h2 className="text-4xl font-bold text-[#263238] mb-20 tracking-tight">Cómo funciona la beta privada</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-[#FFFEFB] p-10 rounded-3xl border border-[#D7DEDA]/60 shadow-sm text-left hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#263238] mb-4">Validación controlada</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">El producto se prueba con un grupo limitado de clínicas.</p>
            </div>
            <div className="bg-[#FFFEFB] p-10 rounded-3xl border border-[#D7DEDA]/60 shadow-sm text-left hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#263238] mb-4">Acceso progresivo</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">Las nuevas cuentas se habilitarán gradualmente.</p>
            </div>
            <div className="bg-[#FFFEFB] p-10 rounded-3xl border border-[#D7DEDA]/60 shadow-sm text-left hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-[#263238] mb-4">Aprendizaje cercano</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">El feedback operativo orienta las siguientes mejoras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Cierre */}
      <section className="py-32 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-[#263238] mb-12 tracking-tight">Una forma más clara de coordinar el día a día de tu clínica.</h2>
        <div className="flex flex-col items-center gap-6">
          <a
            href={MAILTO_LINK}
            className="text-lg font-medium text-[#FFFEFB] bg-[#0F766E] hover:bg-[#115E59] transition-all hover:shadow-lg hover:-translate-y-0.5 px-10 py-4 rounded-full"
          >
            Solicitar demo
          </a>
          <span className="text-sm font-medium text-[#64706F]">Beta privada — próximamente disponible</span>
        </div>
      </section>

      {/* Footer Comercial */}
      <footer className="bg-[#263238] text-[#FFFEFB] py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-8">
                <Image
                  src="/brand/veterp-mark-transparent.png"
                  alt="VetERP Mark"
                  width={40}
                  height={40}
                  className="h-10 w-auto object-contain brightness-0 invert opacity-95"
                />
                <span className="text-3xl font-bold text-[#FFFEFB] tracking-tight">VetERP</span>
              </div>
              <p className="text-[#D7DEDA]/90 text-base max-w-sm leading-relaxed mb-8">
                El sistema operativo para centros veterinarios que buscan calma operativa y excelencia clínica.
              </p>
              <div className="flex items-center gap-2 text-sm text-[#D7DEDA]/80">
                <span>Desarrollado por</span>
                <a href="https://orbitalframeworks.qzz.io/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#FFFEFB] hover:text-[#DDEDEA] transition-colors">
                  OrbitalFrameworks
                </a>
              </div>
            </div>
            
            <div className="md:col-span-3 md:col-start-7">
              <h4 className="font-semibold text-lg mb-6 text-[#FFFEFB]">Producto</h4>
              <ul className="space-y-4 text-base text-[#D7DEDA]/90">
                <li><Link href="/login" className="hover:text-[#FFFEFB] transition-colors">Iniciar sesión</Link></li>
                <li><a href={MAILTO_LINK} className="hover:text-[#FFFEFB] transition-colors">Solicitar demo</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="font-semibold text-lg mb-6 text-[#FFFEFB]">Legal</h4>
              <ul className="space-y-4 text-base text-[#D7DEDA]/90">
                <li><Link href="/privacidad" className="hover:text-[#FFFEFB] transition-colors">Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-[#FFFEFB] transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-[#D7DEDA]/20 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[#D7DEDA]/60">
            <p>© {new Date().getFullYear()} VetERP. Todos los derechos reservados.</p>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <a href={MAILTO_LINK} className="hover:text-[#FFFEFB] transition-colors">
                {CONTACT_EMAIL}
              </a>
              <a href="https://www.instagram.com/orbitalframeworkspe/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFFEFB] transition-colors">
                Instagram @orbitalframeworkspe
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
