# Productization Beta UX Sprint Spec

## Why
El andamiaje técnico de VetERP está construido y es robusto (Fases 1-7 implementadas), pero la experiencia de usuario (UX) y la interfaz (UI) actuales se perciben vacías, difíciles de navegar y dependientes de intervenciones manuales en la base de datos (SQL). Para que VetERP sea evaluable como una **Beta Usable** real, necesitamos un "sprint de productización" enfocado en la ergonomía, la retención post-registro (onboarding) y la utilidad inmediata de la información (Dashboard y estados vacíos).

## What Changes
- **Auto-Onboarding**: Al registrarse un usuario (o en su primer inicio de sesión si no tiene clínica), se creará automáticamente una clínica por defecto, su vínculo `user_clinicas` como `owner`, un almacén principal y un catálogo base de productos/servicios.
- **Dashboard Operativo**: Se reemplazará la pantalla vacía de `/inicio` por un panel real de métricas accionables (Citas de hoy, Ventas del día, Cuentas por cobrar, Alertas de stock bajo).
- **Shell Visual Global**: Se aplicará una actualización al layout base (`layout.tsx` y navegación). Se implementarán anchos máximos (`max-w-7xl`), fondos con contraste (ej. `bg-slate-50`), una barra lateral (sidebar) más compacta, iconos consistentes de `lucide-react` y estados activos en el menú.
- **Estados Vacíos (Empty States)**: Se reemplazarán los textos genéricos de "Sin datos" por componentes visuales atractivos que incluyan una llamada a la acción (CTA) para crear el primer registro.
- **Feedback de Usuario (Toasts)**: Se integrarán notificaciones toast (usando Sonner o la utilidad de shadcn) para dar feedback claro de éxito o error en las acciones (crear, editar, eliminar).
- **Formateo de Datos**: Estandarización visual de monedas (`$ 0.00`) y fechas legibles, junto con insignias (badges) de estado colorizadas.

## Impact
- Affected specs: `rebuild-veterp` (mejora visual sobre la estructura de datos existente).
- Affected code: 
  - `src/app/signup/actions.ts` (lógica de auto-onboarding).
  - `src/app/(operativo)/inicio/page.tsx` (nuevo dashboard).
  - `src/app/(operativo)/layout.tsx` (shell visual, sidebar).
  - Listados en `src/app/(operativo)/clientes`, `src/app/(operativo)/caja_inventario`, `src/app/(operativo)/ajustes`.

## ADDED Requirements
### Requirement: Auto-Onboarding
El sistema DEBE crear el entorno mínimo operativo para un usuario recién registrado para evitar la dependencia de SQL manual.

#### Scenario: Success case
- **WHEN** un usuario nuevo completa el registro (`signup`) exitosamente.
- **THEN** el sistema crea una "Clínica [Nombre]" por defecto, vincula al usuario como owner, crea el "Almacén Principal" y puebla 3-5 ítems de catálogo esenciales.

### Requirement: Dashboard Accionable
El sistema DEBE proveer un resumen de la operación diaria en la ruta raíz de la clínica.

#### Scenario: Success case
- **WHEN** el usuario navega a `/inicio`.
- **THEN** visualiza tarjetas de métricas reales calculadas a partir de la base de datos (citas del día, ingresos, órdenes).

### Requirement: Feedback Visual Global
El sistema DEBE informar al usuario del resultado de sus acciones (mutaciones).

#### Scenario: Success case
- **WHEN** el usuario crea un cliente o ajusta el inventario.
- **THEN** un mensaje tipo "Toast" aparece confirmando la acción (éxito) o detallando el fallo (error).

## MODIFIED Requirements
### Requirement: Listados y Empty States
**Razón**: Las tablas vacías generan confusión y abandono.
**Migración**: Modificar las vistas de lista (Clientes, Inventario, Ajustes) para renderizar un componente `<EmptyState>` ilustrativo con un botón de acción primaria cuando `data.length === 0`.
