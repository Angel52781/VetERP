# VetERP - Instrucciones Locales del Proyecto

## 1. Contexto del proyecto

VetERP es una aplicacion web tipo ERP veterinario para operacion diaria de clinicas: agenda, pacientes, caja, hospitalizacion, modulos operativos y posiblemente landing publica.

Stack detectado:

* Next.js App Router con Turbopack.
* React 19.
* Tailwind CSS.
* Framer Motion / Shadcn UI.
* Supabase / PostgreSQL.
* Zod y React Hook Form.
* Validacion habitual: `npm run lint` y `npm run build`.

Estas reglas complementan el `AGENTS.md` global. No repetir reglas globales salvo que sean especificas para VetERP.

## 2. Zonas de alto riesgo

Tratar estas zonas como sensibles. No modificarlas sin plan explicito y aprobacion:

* Auth, login, logout, sesiones, cookies y redirecciones.
* Supabase clients, queries, policies, RLS, schema y migraciones.
* `src/proxy.ts` o middleware equivalente: tratar como zona sensible de sesion/redireccion hasta auditarlo completo.
* Variables de entorno relacionadas con Supabase, auth, deploy o servicios externos.
* Modulos de caja, inventario, facturacion/billing y datos reales.
* Validadores compartidos en `src/lib/validators` cuando afecten pacientes, caja, agenda u hospitalizacion.

## 3. Reglas especificas de VetERP

* No tocar Auth/Supabase/proxy/middleware por accidente durante limpiezas generales.
* No modificar contratos de datos, validadores Zod o tipos compartidos sin revisar dependencias.
* No corregir masivamente `@typescript-eslint/no-explicit-any`; tipar por dominio, con plan y validacion.
* Los warnings relacionados con `form.watch()` o React Hook Form deben tratarse como refactor de riesgo medio: revisar caso por caso y validar formularios.
* Los archivos no trackeados deben tratarse como trabajo externo del usuario. No mover, borrar ni modificar salvo instruccion explicita.
* No usar nombres reales en seed/mock/demo data.
* No exponer roles internos como `Superadmin` o `Root` en UI publica o materiales de marketing.
* Separar mentalmente app interna y landing publica:

  * app interna: prioridad funcionalidad, claridad operativa y seguridad;
  * landing publica: aplicar criterios UI/SEO/marketing solo cuando la tarea lo pida.

## 4. Flujo recomendado en este repo

Antes de cambios:

1. Ejecutar `git status -sb`.
2. Identificar archivos no trackeados y tratarlos como intocables.
3. Clasificar si la tarea toca zona de alto riesgo.
4. Para tareas medianas/riesgosas, presentar plan antes de editar.

Durante cambios:

* Hacer cambios pequeños, reversibles y auditables.
* No mezclar limpieza, refactor, UI y cambios funcionales en una misma pasada.
* En limpiezas, priorizar imports no usados, variables muertas, JSX inválido y duplicacion trivial.
* No tocar `any` masivos ni contratos Supabase dentro de una limpieza superficial.

Validacion:

* Para cambios de codigo o configuracion, ejecutar `npm run lint` y `npm run build` cuando aplique.
* Para cambios menores de copy/estilos, revisar `git diff --stat` y justificar si no se ejecuta build.
* Si el cambio de estilos afecta layout/responsive, ejecutar build o QA visual cuando aplique.
* Al cerrar, reportar archivos modificados, resultado de validacion y riesgos pendientes.

## 5. Uso de skills en VetERP

* Auditoria/reconocimiento: `project-analyzer`, `code-tour` o `workspace-surface-audit`.
* Limpieza/refactor seguro: `plankton-code-quality` + `verification-loop`.
* Supabase/Auth/API/datos: `security-review`, `security-scan`, `postgres-patterns` y `database-migrations` solo si el alcance lo requiere.
* UI interna: usar skills de diseño con moderacion; priorizar usabilidad operativa sobre efectos visuales.
* Landing publica: `ui-ux-pro-max`, `impeccable`, `taste-skill` y `seo-audit` cuando la tarea sea marketing/landing/SEO.
