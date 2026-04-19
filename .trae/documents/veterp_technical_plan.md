# VetERP - Plan Técnico de Implementación

## 1. Stack Técnico Propuesto
- **Framework Frontend & Backend**: **[Recomendado] Next.js (App Router) + TypeScript**.
  - *Por qué:* Permite crear un monolito moderno (React Server Components para renderizado rápido, Server Actions para mutaciones seguras) sin mantener dos repositorios separados. Aplica las mejores prácticas de rendimiento de Vercel.
- **Base de Datos, Auth y Storage**: **[Recomendado] Supabase (PostgreSQL)**.
  - *Por qué:* Su característica de **Row-Level Security (RLS)** soluciona de raíz el riesgo crítico (P0) de aislamiento multi-tenant del sistema original. Además provee Auth nativo y Storage para adjuntos médicos.
- **Estilos & Componentes UI**: **[Recomendado] Tailwind CSS + shadcn/ui + Lucide Icons**.
  - *Por qué:* Asegura una estética limpia, profesional y de grado de producción (Frontend Design Best Practices), altamente personalizable y accesible.
- **Manejo de Estado & Fetching**: **[Recomendado] React Server Components (RSC) + Server Actions**.
  - *Por qué:* Evita *waterfalls* de red (Vercel Best Practices). Para el estado local de UI (ej. el Kanban de colas), se usará **Zustand**.
- **Validación de Formularios**: **[Decidido] React Hook Form + Zod**.
  - *Por qué:* Para asegurar integridad de datos (ej. prevenir `clinica = null` o relaciones huérfanas) antes de tocar la base de datos.

## 2. Arquitectura Propuesta
**[Recomendado] Arquitectura Serverless Monolítica (Next.js + Supabase):**
1. **Capa de Presentación (Client Components):** Interfaces interactivas (Kanban, formularios modales, selectores de pacientes).
2. **Capa de Lógica de Vista (Server Components):** Consultas directas y seguras a la base de datos en el servidor, eliminando llamadas a APIs intermedias innecesarias.
3. **Capa de Mutación (Server Actions):** Funciones de servidor que reciben datos, los validan con Zod, inyectan el `clinica_id` del usuario autenticado (extraído de la sesión/JWT) y ejecutan la escritura en Supabase.
4. **Capa de Datos (PostgreSQL):** Políticas RLS que actúan como la última línea de defensa (Security Best Practices).

## 3. Estructura de Carpetas
**[Recomendado]**
```text
src/
├── app/
│   ├── (auth)/             # login, signup, reset_pw
│   ├── (operativo)/        # layout protegido (navbar)
│   │   ├── index/          # panel de atenciones
│   │   ├── clientes/       # clientes_mascotas
│   │   ├── caja/           # caja_inventario
│   │   ├── agenda/         # agenda_colas_settings
│   │   └── orden/[id]/     # orden_y_colas (detalle)
│   └── select_clinica/     # selección de tenant
├── components/
│   ├── ui/                 # componentes base (shadcn)
│   ├── layout/             # navbar unificado
│   └── shared/             # modales (Nueva Atención, Nueva Cita)
├── lib/
│   ├── supabase/           # cliente SSR y utilidades
│   ├── actions/            # Server Actions (crear cita, pagar)
│   └── utils.ts            # helpers
└── types/                  # definiciones TS de la BD
```

## 4. Estrategia de Estado y Data Fetching
- **Lecturas:** **[Recomendado]** Se priorizan Server Components para vistas iniciales (ej. Directorio de clientes). Se usa *Suspense Boundaries* para cargar componentes de forma progresiva.
- **Mutaciones:** **[Decidido]** Server Actions con `revalidatePath` para actualizar la UI inmediatamente después de escribir en base de datos.
- **Vistas en Tiempo Real:** **[Recomendado]** Para el tablero Kanban de colas, se puede implementar Supabase Realtime suscrito a la tabla `ItemCola`.

## 5. Estrategia de Autenticación y Autorización
- **Auth:** **[Decidido]** Supabase Auth (Email/Password).
- **Autorización (RBAC):** **[Recomendado]** Basado en el campo `MembresiaClinica.rol_text`. Las Server Actions y los Server Components verificarán este rol antes de procesar pagos en Caja o acceder a Settings.

## 6. Estrategia Multi-Tenant y de Base de Datos
- **Tenant Context:** **[Decidido]** Al pasar por `select_clinica`, se guarda el `clinica_id` en una Cookie Segura (HTTP-Only) o se actualiza el JWT Custom Claim de Supabase.
- **Aislamiento Físico:** **[Decidido]** **Row-Level Security (RLS)**. Cada tabla tendrá la política: `clinica_id = (select auth.jwt()->>'clinica_id')`.
- **Mitigación Financiera (P1):** **[Decidido]** El total de `Venta` y el stock (`MovimientoStock`) no se confiarán al cliente. Se usarán funciones SQL o Server Actions estrictas para calcular totales y prevenir corrupción.

## 7. Componentes Reutilizables
**[Decidido]**
- **Modales Estándar:** Para creación rápida de entidades interconectadas (ej. agendar cita creando un cliente al vuelo).
- **Selectores Asíncronos (Combobox):** Búsqueda de clientes/mascotas en tiempo real.
- **Tablas de Datos (DataTables):** Con paginación, ordenamiento y filtrado unificado.

## 8. Roadmap de Implementación por Fases (Refinado)
- **Fase 1:** Auth + Tenant Context + Navegación Protegida (Infraestructura, Login, RLS base).
- **Fase 2:** Clientes + Mascotas (CRUD base, integridad referencial).
- **Fase 3:** Agenda + Citas (Catálogos de citas, calendario).
- **Fase 4:** Órdenes + Entradas Clínicas + Adjuntos (Flujo médico, Supabase Storage, Kanban de colas).
- **Fase 5:** Caja + Ventas + Item Venta + Ledger (Catálogo de servicios/productos, vinculación de ventas a órdenes, pagos).
- **Fase 6:** Inventario + Movimiento Stock (Catálogo de logística, Kardex, ajustes de stock).
- **Fase 7:** Hardening + QA + Permisos (RBAC, optimizaciones de rendimiento Vercel, auditoría de RLS).

## 9. Riesgos y Criterios de Aceptación por Fase
*(Los criterios de aceptación y riesgos específicos se han mapeado en el archivo `checklist.md` y `tasks.md` respectivamente).*
- **Riesgo Fase 1:** Fuga del contexto del tenant. *Mitigación:* Pruebas unitarias de las políticas RLS.
- **Riesgo Fase 4:** Transiciones de estado inconsistentes. *Mitigación:* Enums estrictos en DB.
- **Riesgo Fase 5:** Descuadres financieros. *Mitigación:* Cálculos validados en el servidor.

## 10. Decisiones que requieren confirmación antes de construir
**C) Pendientes de Confirmación:**
1. **Stack Propuesto:** ¿Apruebas el uso de **Next.js + Supabase + Tailwind + shadcn/ui**? (Este stack es la recomendación número uno para aplicaciones B2B modernas y seguras).
2. **Tablero Kanban de Colas:** ¿Deseas que este tablero se actualice en tiempo real (websockets) a través de Supabase Realtime, o basta con actualizar la página / revalidar tras cada acción?
3. **Manejo de Roles:** Asumiré dos roles básicos (`admin` y `staff`) derivados de `MembresiaClinica.rol_text` para proteger Settings y Caja. ¿Es correcto?
