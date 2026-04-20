# Implement Phase 6 Inventory Spec

## Why
La aplicación requiere el módulo de inventario y logística para gestionar el stock real de productos y manejar catálogos de proveedores y almacenes, con el objetivo de asegurar que las ventas de tipo "producto" afecten el stock general, previniendo inconsistencias de Kardex.

## What Changes
- Creación de migraciones SQL para las tablas de `almacenes` y `movimientos_stock` (notando que `proveedores` ya fue pre-creada en Fase 5, se requiere ajustar / confirmar políticas de RLS).
- Implementación de UI para el CRUD de `Proveedores` y `Almacenes` en `/ajustes`.
- Extensión de la vista `/caja_inventario` añadiendo un tab/sección dedicada al Kardex/Inventario para ver el stock consolidado (calculado a través de `SUM(qty)` de los movimientos).
- Inclusión de un flujo de UI para registrar un `MovimientoStock` manual.
- Intervención en el proceso de agregar/quitar ítems a una venta (de la Fase 5) o registrar el pago para ejecutar la **rebaja automática de stock** en caso de que un ítem vendido sea de tipo `"producto"`.
- Políticas estrictas de Row-Level Security (RLS) para todas las tablas logísticas integradas con `User.clinica_activa`.

## Impact
- Affected specs: Fase 6 (Inventario y Movimiento de Stock).
- Affected code: 
  - `supabase/migrations/0006_inventario.sql` (nuevo)
  - `src/app/(operativo)/ajustes/` (extensión de pestañas y Server Actions)
  - `src/app/(operativo)/caja_inventario/` (nuevo tab de Inventario)
  - `src/app/(operativo)/caja_inventario/actions.ts` (modificado para rebaja automática)

## ADDED Requirements
### Requirement: Control de Stock por Sumatoria
El stock NO debe ser una columna explícita modificable por el usuario, sino el resultado de una función de suma `SUM(qty)` sobre todos los `MovimientoStock` vinculados a un `ItemCatalogo` y `Almacen` específicos.

#### Scenario: Rebaja automática por venta
- **WHEN** un usuario agrega un ítem de tipo "producto" a una venta y la orden avanza/se paga (o al agregarse directamente, según la estrategia que se defina)
- **THEN** el backend inserta automáticamente un registro negativo en `movimientos_stock` con referencia a esa venta y el ítem.

## MODIFIED Requirements
### Requirement: Venta de Productos
Se debe agregar lógica en el Server Action responsable de confirmar la venta (o agregar el ítem) para generar el movimiento de stock respectivo si `ItemCatalogo.kind === "producto"`.
