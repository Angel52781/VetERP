# Product Requirements Document (PRD) - VetERP Landing Page
**VersiÃ³n 1.1**

## 1. Objetivo de la landing
Presentar VetERP como una soluciÃ³n de gestiÃ³n veterinaria profesional, moderna y fÃ¡cil de usar. Al estar en **beta privada**, el objetivo NO es la venta inmediata, ni el registro abierto, sino transmitir el valor del producto y dejar claro su estado actual.

## 2. Audiencia objetivo
- DueÃ±os y administradores de clÃ­nicas veterinarias.
- Veterinarios independientes.
- ClÃ­nicas que buscan una experiencia de usuario clara y moderna.

## 3. Posicionamiento
VetERP es una herramienta sobria, profesional y moderna, enfocada en la facilidad de uso para la dinÃ¡mica diaria de una clÃ­nica veterinaria.

## 4. Mensaje principal (Copy Base)
**Hero:** "Organiza la operaciÃ³n diaria de tu clÃ­nica veterinaria."
**Subcopy:** "Agenda, atenciÃ³n clÃ­nica, pacientes, cobros e inventario en un espacio claro y fÃ¡cil de usar. VetERP estÃ¡ en beta privada y el acceso se habilitarÃ¡ progresivamente."

## 5. Propuesta de valor
- **OperaciÃ³n centralizada:** Agenda, cobros e historial clÃ­nico organizados.
- **Experiencia clara:** Interfaz moderna y fÃ¡cil de usar.
- **Adaptabilidad:** Soporta consultas clÃ­nicas, grooming y gestiÃ³n bÃ¡sica de inventario.

## 6. Estado y Enrutamiento (Decisiones Cerradas)
- `/` serÃ¡ la landing pÃºblica.
- Las rutas internas operativas de la clÃ­nica viven en la raÃ­z (ej. `/recepcion`, `/agenda`) gracias al route group `(operativo)`, siendo todas ellas protegidas.
- `/login` serÃ¡ accesible como CTA secundario ("Iniciar sesiÃ³n") para usuarios existentes.
- `/signup` queda completamente fuera de la landing (no se enlaza).
- **CTA Principal:** "Beta privada â€” prÃ³ximamente disponible" (texto informativo, no botÃ³n de acciÃ³n).
- **No** habrÃ¡ formulario comercial todavÃ­a (decisiÃ³n a futuro).
- **No** se muestran precios.
- **No** hay compra directa.
- **No** hay registro abierto.

## 7. Matriz de Funcionalidades
ClasificaciÃ³n realista de mÃ³dulos para la comunicaciÃ³n en la landing:

**Destacable en landing (Protagonistas):**
- Agenda
- Pacientes (Ficha del paciente e historia clÃ­nica / Paciente 360)
- Historia clÃ­nica / LÃ­nea de tiempo
- AtenciÃ³n clÃ­nica
- Seguimientos / recordatorios internos

**Mostrable con cuidado (Simples, sin prometer automatizaciÃ³n compleja):**
- RecepciÃ³n
- Caja
- Inventario
- Grooming
- Contexto reciente (como apoyo a la atenciÃ³n clÃ­nica)
- Antecedentes clÃ­nicos / registros previos (no prometer importaciÃ³n masiva automÃ¡tica)
- Hospitalizaciones (no exagerar alcance)

**Interno / no protagonista:**
- Staff / ajustes

**Futuro / No prometer (EXCLUIDOS de la comunicaciÃ³n actual):**
- Automatizaciones por WhatsApp/Email
- FacturaciÃ³n electrÃ³nica y contabilidad completa
- ImportaciÃ³n automÃ¡tica masiva
- IA

## 8. Secciones de la Landing
1. **Navbar:** Logo, estado "Beta Privada", enlace "Iniciar sesiÃ³n" (`/login`).
2. **Hero Section:** Copy base propuesto + Screenshot realista de la interfaz principal.
3. **Features (Lo que sÃ­ funciona):**
   - Agenda (ClÃ­nica y Grooming).
   - AtenciÃ³n ClÃ­nica y Pacientes.
   - Caja e Inventario.
4. **Footer:** RepeticiÃ³n del mensaje "PrÃ³ximamente disponible".

## 9. Lo que NO decir/prometer
- No usar claims absolutos ("gestiÃ³n integral", "todo el control", "sin fricciones", "soporte premium").
- No prometer Hospitalizaciones.
- No hablar de automatizaciones de WhatsApp/Email para recordatorios.
- No mencionar "Paciente 360" o importaciÃ³n mÃ¡gica de historiales.
- No ofrecer "Registro instantÃ¡neo" o pruebas gratis.

## 10. Criterios de AceptaciÃ³n para Implementar Landing
- Desktop 1440px y Mobile responsive.
- Navbar clara (logo + Iniciar sesiÃ³n).
- Hero con screenshot real que cumpla el protocolo seguro.
- CTA coherente: "Beta privada â€” prÃ³ximamente disponible".
- BotÃ³n "Iniciar sesiÃ³n" apuntando a `/login`.
- SEO bÃ¡sico: title, description, OG image.
- Accesibilidad bÃ¡sica.
- Cero fugas de rutas protegidas operativas (ej. `/recepcion`, `/agenda`, `/app`).
- Cero promesas comerciales no soportadas.

## 11. Assets Oficiales de Marca
Se han confirmado los siguientes assets en `public/brand/` para el uso en la landing y mockups:
- **Logo principal de navbar:** `public/brand/veterp-logo-horizontal-transparent.png`
- **Isotipo/favicon base:** `public/brand/veterp-mark-transparent.png`
- **Logo vertical para hero/mockups:** `public/brand/veterp-logo-vertical-primary-transparent.png`
- **Versiones de fondo oscuro:** `public/brand/veterp-logo-vertical-light-dark.png` y/o `public/brand/veterp-logo-vertical-light-teal.png`

*(Existen mÃ¡s variaciones cream/teal/graphite disponibles en la misma carpeta para uso especÃ­fico si el diseÃ±o lo requiere).*
