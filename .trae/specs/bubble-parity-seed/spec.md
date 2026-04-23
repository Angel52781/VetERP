# Paridad contra Bubble + Seed Demo Spec

## Why
La reconstrucción técnica actual de VetERP es robusta, pero la interfaz y el estado de la aplicación no reflejan la experiencia de uso (UX) y la densidad de información que tenía el producto original en Bubble. El sistema se siente vacío y como un "scaffold" técnico. Para lograr una beta usable, necesitamos recuperar la paridad de navegación, inyectar datos semilla (seed data) realistas y mejorar la fidelidad visual de las pantallas core.

## What Changes
- **Navegación Paritaria**: Reestructurar el menú lateral para reflejar las opciones originales de Bubble (Atenciones, Colas, Caja, Inventario, Agenda, Clientes, Settings).
- **Seed Data Realista**: Expandir el archivo `supabase/seed.sql` para inyectar una clínica demo completa con owner, clientes, mascotas, citas, órdenes, ventas, catálogo, proveedores, almacenes y stock inicial.
- **Refinamiento de Pantallas Core**: Mejorar el layout, la densidad visual y el uso de "empty states" y "toasts" en las vistas principales (`inicio`, `clientes`, `orden_y_colas`, `agenda`, `caja_inventario`, `ajustes`).
- **Selector de Clínica**: Asegurar la usabilidad y consistencia visual del selector de clínica post-registro/login.

## Impact
- Affected specs: `productize-beta-ux` (construye sobre los layouts y componentes base definidos).
- Affected code:
  - `src/app/(operativo)/sidebar-nav.tsx` (Navegación principal).
  - `supabase/seed.sql` (Seed de datos completos).
  - Pantallas de módulo (`inicio`, `clientes`, `orden_y_colas`, `agenda`, `caja_inventario`, `ajustes`).

## ADDED Requirements
### Requirement: Seed Data Realista
El sistema DEBE proveer un entorno de pruebas poblado automáticamente para nuevas instancias o reseteos.

#### Scenario: Success case
- **WHEN** se ejecuta el reseteo de la base de datos (`supabase db reset`).
- **THEN** el sistema contiene una clínica funcional, clientes con mascotas, citas programadas, historial de órdenes, catálogo con inventario y movimientos de caja.

### Requirement: Navegación Estilo Bubble
El sistema DEBE ofrecer un menú lateral que replique la organización mental del usuario de la app original.

#### Scenario: Success case
- **WHEN** el usuario autenticado ingresa a la aplicación.
- **THEN** visualiza un menú lateral con accesos directos claros a Atenciones, Colas, Caja, Inventario, Agenda, Clientes y Settings, con estados activos precisos.

## MODIFIED Requirements
### Requirement: Densidad Visual de Pantallas
**Razón**: Las pantallas actuales desperdician espacio y se ven como plantillas genéricas.
**Migración**: Ajustar los layouts de las tablas, tarjetas de resumen y formularios para maximizar la información visible sin sacrificar legibilidad, utilizando `max-w-7xl` y grids más densos.
