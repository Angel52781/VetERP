"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const CONTACT_EMAIL = "contact.orbitalframeworks@gmail.com";
const MAILTO_LINK = `mailto:${CONTACT_EMAIL}?subject=Solicitud%20de%20demo%20VetERP`;

const springConfig = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 };

function BrowserFrame({ children, title = "", rotate = false }: { children: React.ReactNode, title?: string, rotate?: boolean }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [rotate ? 15 : 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [rotate ? 0.9 : 1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [rotate ? 50 : 0, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, scale, y, perspective: "1000px", transformStyle: "preserve-3d" }}
      className="w-full rounded-xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(15,118,110,0.05)] border border-[#D7DEDA]/80 bg-[#FFFFFF] transition-transform duration-500"
    >
      {/* Browser Header */}
      <div className="h-10 bg-[#FFFFFF] border-b border-[#D7DEDA]/40 flex items-center px-4 relative">
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
    </motion.div>
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

// --------------------------------------------------------------------------------
// SECTIONS
// --------------------------------------------------------------------------------

function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#FFFEFB]/90 backdrop-blur-md border-b border-[#D7DEDA]/40 shadow-sm" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 rounded-md">
          <Image
            src="/brand/veterp-mark-transparent.png"
            alt="VetERP Mark"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
          <span className="text-xl font-bold text-[#263238] tracking-tighter">VetERP</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[15px] font-medium text-[#64706F]">
          <a href="#producto" className="hover:text-[#0F766E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 rounded-md">Producto</a>
          <a href="#flujo" className="hover:text-[#0F766E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 rounded-md">Flujo</a>
          <a href="#beta" className="hover:text-[#0F766E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 rounded-md">Beta privada</a>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden sm:block text-[14px] font-medium text-[#64706F] hover:text-[#0F766E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 rounded-md px-2 py-1"
          >
            Iniciar sesión
          </Link>
          <a
            href={MAILTO_LINK}
            className="text-[15px] font-medium text-[#FFFFFF] bg-[#0F766E] hover:bg-[#115E59] transition-all hover:shadow-[0_0_20px_rgba(15,118,110,0.3)] px-6 py-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
          >
            Solicitar demo
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: springConfig },
  };

  return (
    <section className="pt-48 pb-24 px-6 max-w-[1200px] mx-auto text-center flex flex-col items-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center w-full"
      >
        <motion.div variants={itemVariants} className="mb-10">
          <SectionEyebrow centered>Beta Privada</SectionEyebrow>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl leading-[1.15] font-bold text-[#263238] tracking-tighter max-w-[900px] mb-8"
        >
          Organiza la operación diaria de tu clínica veterinaria.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-[#64706F] max-w-[800px] mb-12 leading-relaxed"
        >
          Agenda, atención clínica, pacientes, cobros e inventario en un espacio claro y fácil de usar.
          VetERP está en beta privada y el acceso se habilitará progresivamente.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-5 mb-16 w-full sm:w-auto">
          <a
            href={MAILTO_LINK}
            className="text-base font-medium text-[#FFFFFF] bg-[#0F766E] hover:bg-[#115E59] transition-all hover:shadow-[0_0_20px_rgba(15,118,110,0.3)] hover:-translate-y-0.5 px-8 py-4 rounded-full w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
          >
            Solicitar demo
          </a>
          <Link
            href="/login"
            className="text-base font-medium text-[#263238] bg-[#FFFFFF] hover:bg-[#F7F4EC] border border-[#D7DEDA] shadow-[0_2px_10px_-4px_rgba(15,118,110,0.05)] transition-colors px-8 py-4 rounded-full w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
          >
            Iniciar sesión
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 mb-24">
          <span className="text-xs font-medium text-[#64706F] uppercase tracking-wider">Una iniciativa de</span>
          <a href="https://orbitalframeworks.qzz.io/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFFFF] shadow-[0_2px_10px_-4px_rgba(15,118,110,0.05)] border border-[#D7DEDA]/50 hover:border-[#0F766E]/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">
            <span className="text-sm font-bold text-[#263238] group-hover:text-[#0F766E] transition-colors">OrbitalFrameworks</span>
          </a>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full max-w-[1080px] mx-auto perspective-[1000px]">
          <BrowserFrame title="veterp.com/app/recepcion" rotate={true}>
            <Image
              src="/landing/screenshots/hero-recepcion-dashboard.png"
              alt="Dashboard de recepción de VetERP mostrando programación y atenciones operativas"
              width={1280}
              height={817}
              quality={100}
              unoptimized
              className="w-full h-auto block"
              priority
            />
          </BrowserFrame>
        </motion.div>
      </motion.div>
    </section>
  );
}

function BeneficiosSection() {
  const features = [
    {
      title: "Orden diario",
      desc: "Recepción y agenda conectadas para visualizar lo que sigue.",
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
    },
    {
      title: "Continuidad clínica",
      desc: "La información del paciente acompaña cada atención de forma segura.",
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    },
    {
      title: "Control operativo",
      desc: "Cobros y stock visibles sin convertir la experiencia en un sistema pesado.",
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    }
  ];

  return (
    <section id="producto" className="py-32 bg-gradient-to-b from-[#FFFEFB] to-[#F7F4EC]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={springConfig}
          className="mb-20 max-w-2xl"
        >
          <SectionEyebrow className="mb-6">Producto</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238] tracking-tighter">El contexto que tu equipo necesita, donde lo necesita.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-x-12 gap-y-16">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ ...springConfig, delay: i * 0.1 }}
              whileHover="hover"
              className="flex flex-col items-center text-center md:items-start md:text-left bg-[#FFFFFF] p-8 rounded-3xl border border-[#D7DEDA]/40 shadow-[0_2px_10px_-4px_rgba(15,118,110,0.05)] transition-colors cursor-default"
              variants={{
                hover: {
                  scale: 1.02,
                  boxShadow: "0 20px 40px -15px rgba(15,118,110,0.15)",
                }
              }}
            >
              <motion.div
                variants={{ hover: { scale: 1.1 } }}
                transition={springConfig}
                className="w-14 h-14 rounded-2xl bg-[#DDEDEA] text-[#0F766E] flex items-center justify-center mb-6 shadow-sm"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-semibold mb-3 text-[#263238] tracking-tight">{feature.title}</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------------
// FEATURE SCROLL SHOWCASE (STICKY SCROLL)
// --------------------------------------------------------------------------------

const featureShowcaseItems = [
  {
    title: "Agenda organizada por área",
    desc: "Consulta, grooming y otros tipos de cita se ordenan en una vista operativa fácil de recorrer.",
    src: "/landing/screenshots/feature-agenda-operativa.png",
    url: "veterp.com/app/agenda"
  },
  {
    title: "La historia del paciente, con continuidad",
    desc: "Antecedentes, atenciones y seguimientos reunidos en una línea de tiempo clara y auditable.",
    src: "/landing/screenshots/feature-historia-clinica.png",
    url: "veterp.com/app/mascotas"
  },
  {
    title: "Seguimiento durante la hospitalización",
    desc: "Controles y tratamientos visibles dentro del seguimiento riguroso del paciente en piso.",
    src: "/landing/screenshots/feature-hospitalizacion-clinica.png",
    url: "veterp.com/app/hospitalizaciones",
    badge: "Módulo mostrado con alcance de beta privada."
  },
  {
    title: "Caja e inventario como soporte de la operación",
    desc: "Cobros, ventas y existencias en vistas separadas y fiables, fáciles de revisar al cierre de turno.",
    src: "/landing/screenshots/feature-finanzas-caja.png",
    url: "veterp.com/app/caja"
  }
];

function FeatureTextItem({ item, index, activeIndex, setActiveIndex }: { item: typeof featureShowcaseItems[0], index: number, activeIndex: number, setActiveIndex: (i: number) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-10% 0px 0px 0px", amount: "some" });

  useEffect(() => {
    if (isInView) {
      setActiveIndex(index);
    }
  }, [isInView, index, setActiveIndex]);

  const isActive = activeIndex === index;

  return (
    <div ref={ref} className={`transition-all duration-700 ${isActive ? "opacity-100 translate-x-0" : "opacity-30 -translate-x-4"}`}>
      <h3 className="text-3xl font-bold text-[#263238] mb-6 tracking-tighter">{item.title}</h3>
      <p className="text-xl text-[#64706F] leading-relaxed mb-6">{item.desc}</p>
      {item.badge && (
        <span className="text-sm text-[#0F766E] font-medium bg-[#DDEDEA] inline-flex px-4 py-2 rounded-lg">{item.badge}</span>
      )}
    </div>
  );
}

function FeatureScrollShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      {/* Desktop Version: Sticky Scroll Clean */}
      <section className="hidden md:block relative bg-[#FFFEFB] pb-32">
        <div className="max-w-[1200px] mx-auto px-6 flex items-start gap-16 relative">
          
          {/* Lado Izquierdo: Textos que scrollean naturalmente */}
          <div className="w-1/2 py-[50vh] space-y-[100vh]">
            {featureShowcaseItems.map((item, i) => (
              <FeatureTextItem 
                key={i} 
                item={item} 
                index={i} 
                activeIndex={activeIndex} 
                setActiveIndex={setActiveIndex} 
              />
            ))}
          </div>

          {/* Lado Derecho: Imagen Sticky limpia */}
          <div className="w-1/2 sticky top-24 h-[calc(100vh-6rem)] flex items-center justify-center">
            <div className="w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full"
                >
                  <BrowserFrame title={featureShowcaseItems[activeIndex].url}>
                    <div className="relative w-full overflow-hidden bg-white max-h-[65vh]">
                      <Image 
                        src={featureShowcaseItems[activeIndex].src} 
                        alt={featureShowcaseItems[activeIndex].title} 
                        width={1280} 
                        height={900} 
                        quality={100} 
                        unoptimized
                        priority
                        className="w-full h-auto block object-cover object-top" 
                      />
                      {activeIndex === 1 && (
                         <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FFFFFF] to-transparent pointer-events-none" />
                      )}
                    </div>
                  </BrowserFrame>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* Mobile Version: Stacked / Fluent Grid */}
      <section className="md:hidden pb-32 px-6 space-y-24 bg-[#FFFEFB]">
        {featureShowcaseItems.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={springConfig}
            className="flex flex-col gap-6"
          >
            <div>
              <h3 className="text-3xl font-bold text-[#263238] mb-4 tracking-tighter">{item.title}</h3>
              <p className="text-xl text-[#64706F] leading-relaxed mb-4">{item.desc}</p>
              {item.badge && (
                <span className="text-sm text-[#0F766E] font-medium bg-[#DDEDEA] inline-flex px-4 py-2 rounded-lg">{item.badge}</span>
              )}
            </div>
            <BrowserFrame title={item.url}>
              <div className="relative w-full overflow-hidden bg-white max-h-[50vh]">
                <Image 
                  src={item.src} 
                  alt={item.title} 
                  width={1280} 
                  height={900} 
                  quality={100} 
                  unoptimized 
                  className="w-full h-auto block object-cover object-top" 
                />
              </div>
            </BrowserFrame>
          </motion.div>
        ))}
      </section>
    </>
  );
}

// --------------------------------------------------------------------------------
// SPOTLIGHT CARD (BETA PRIVADA)
// --------------------------------------------------------------------------------

function SpotlightCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="relative overflow-hidden bg-[#FFFFFF] p-10 rounded-3xl border border-[#D7DEDA]/60 shadow-[0_2px_10px_-4px_rgba(15,118,110,0.05)] text-left"
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(15,118,110,0.08), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function BetaPrivadaSection() {
  return (
    <section id="beta" className="pt-32 pb-40 bg-[#F7F4EC] border-y border-[#D7DEDA]/40">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={springConfig}
        >
          <SectionEyebrow centered className="mb-6">Beta Privada</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238] mb-20 tracking-tighter">Cómo funciona la beta privada</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ ...springConfig, delay: 0.1 }}
          >
            <SpotlightCard>
              <h3 className="text-xl font-bold text-[#263238] mb-4 tracking-tight">Validación controlada</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">El producto se prueba con un grupo limitado de clínicas bajo estricto control de datos.</p>
            </SpotlightCard>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ ...springConfig, delay: 0.2 }}
          >
            <SpotlightCard>
              <h3 className="text-xl font-bold text-[#263238] mb-4 tracking-tight">Acceso progresivo</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">Las nuevas cuentas se habilitarán gradualmente para garantizar estabilidad operativa.</p>
            </SpotlightCard>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ ...springConfig, delay: 0.3 }}
          >
            <SpotlightCard>
              <h3 className="text-xl font-bold text-[#263238] mb-4 tracking-tight">Aprendizaje clínico</h3>
              <p className="text-[#64706F] text-lg leading-relaxed">El feedback del personal médico orienta las siguientes mejoras del sistema.</p>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------------
// MAIN CLIENT EXPORT
// --------------------------------------------------------------------------------

export default function LandingClient() {
  return (
    <div className="min-h-screen bg-[#FFFEFB] text-[#263238] font-sans selection:bg-[#DDEDEA]">
      <Navbar />
      
      <HeroSection />
      
      <BeneficiosSection />

      <div className="text-center pt-20 pb-0 max-w-3xl mx-auto bg-[#FFFEFB]">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={springConfig}
        >
          <SectionEyebrow centered className="mb-6">Flujo</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238] tracking-tighter px-6">
            Un flujo que acompaña el trabajo de la clínica.
          </h2>
        </motion.div>
      </div>

      <FeatureScrollShowcase />

      {/* Nota de privacidad visible */}
      <section className="py-20 bg-[#FFFEFB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={springConfig}
            className="max-w-4xl mx-auto bg-[#FFFFFF] rounded-3xl p-10 border border-[#D7DEDA]/60 text-center shadow-[0_2px_10px_-4px_rgba(15,118,110,0.05)]"
          >
             <SectionEyebrow centered className="mb-5">Privacidad</SectionEyebrow>
             <p className="text-[#64706F] text-lg leading-relaxed max-w-2xl mx-auto">
               VetERP está diseñado para manejar información operativa y clínica con extremo cuidado, utilizando cifrado estándar de la industria. Durante la beta privada, el acceso se habilita de forma controlada.
             </p>
          </motion.div>
        </div>
      </section>

      <BetaPrivadaSection />

      {/* CTA Cierre */}
      <section className="py-32 px-6 text-center max-w-4xl mx-auto bg-[#FFFEFB]">
        <motion.h2 
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={springConfig}
          className="text-4xl md:text-5xl font-bold text-[#263238] mb-12 tracking-tighter"
        >
          Una forma más clara de coordinar el día a día de tu clínica.
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ ...springConfig, delay: 0.1 }}
          className="flex flex-col items-center gap-6"
        >
          <a
            href={MAILTO_LINK}
            className="text-lg font-medium text-[#FFFFFF] bg-[#0F766E] hover:bg-[#115E59] transition-all hover:shadow-[0_0_20px_rgba(15,118,110,0.3)] hover:-translate-y-0.5 px-10 py-4 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
          >
            Solicitar demo
          </a>
          <span className="text-sm font-medium text-[#64706F]">Beta privada — próximamente disponible</span>
        </motion.div>
      </section>

      {/* Footer Comercial */}
      <footer className="bg-[#263238] text-[#FFFFFF] py-20">
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
                <span className="text-3xl font-bold text-[#FFFFFF] tracking-tighter">VetERP</span>
              </div>
              <p className="text-[#D7DEDA]/90 text-base max-w-sm leading-relaxed mb-8">
                El sistema operativo para centros veterinarios que buscan calma operativa y excelencia clínica bajo altos estándares de seguridad.
              </p>
              <div className="flex items-center gap-2 text-sm text-[#D7DEDA]/80">
                <span>Desarrollado por</span>
                <a href="https://orbitalframeworks.qzz.io/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#FFFFFF] hover:text-[#DDEDEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263238] rounded-sm px-1">
                  OrbitalFrameworks
                </a>
              </div>
            </div>
            
            <div className="md:col-span-3 md:col-start-7">
              <h4 className="font-semibold text-lg mb-6 text-[#FFFFFF]">Producto</h4>
              <ul className="space-y-4 text-base text-[#D7DEDA]/90">
                <li><Link href="/login" className="hover:text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263238] rounded-sm px-1 -ml-1">Iniciar sesión</Link></li>
                <li><a href={MAILTO_LINK} className="hover:text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263238] rounded-sm px-1 -ml-1">Solicitar demo</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="font-semibold text-lg mb-6 text-[#FFFFFF]">Legal</h4>
              <ul className="space-y-4 text-base text-[#D7DEDA]/90">
                <li><Link href="/privacidad" className="hover:text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263238] rounded-sm px-1 -ml-1">Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263238] rounded-sm px-1 -ml-1">Términos</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-[#D7DEDA]/20 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[#D7DEDA]/60">
            <p>© {new Date().getFullYear()} VetERP. Todos los derechos reservados.</p>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <a href={MAILTO_LINK} className="hover:text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263238] rounded-sm px-1">
                {CONTACT_EMAIL}
              </a>
              <a href="https://www.instagram.com/orbitalframeworkspe/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFFFFF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263238] rounded-sm px-1">
                Instagram @orbitalframeworkspe
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
