# Tasks

- [x] Task 1: Fase 6 - Migraciones de Base de Datos para Inventario
  - [x] SubTask 1.1: Crear migración `0006_inventario.sql` definiendo las tablas `almacenes` y `movimientos_stock` con RLS, triggers y FKs a `clinicas` y `items_catalogo`.
  - [x] SubTask 1.2: Revisar las políticas y constraints preexistentes de la tabla `proveedores` de la Fase 5 y asegurar que cumplan para esta fase.
- [x] Task 2: Fase 6 - CRUD de Catálogos Logísticos en `/ajustes`
  - [x] SubTask 2.1: Crear esquemas Zod (validaciones) para `Proveedor` y `Almacen`.
  - [x] SubTask 2.2: Implementar Server Actions para `Proveedores` y `Almacenes`.
  - [x] SubTask 2.3: Desarrollar los componentes UI de la lista y formularios para `Proveedores` y `Almacenes` en el tab respectivo de `/ajustes`.
- [x] Task 3: Fase 6 - Vista de Inventario / Kardex en `/caja_inventario`
  - [x] SubTask 3.1: Desarrollar Server Actions que devuelvan el stock agrupado por producto usando `SUM(qty)` desde `movimientos_stock`.
  - [x] SubTask 3.2: Crear el nuevo tab "Inventario" en la vista de `Caja y Ventas` que liste todos los productos y su stock actual.
  - [x] SubTask 3.3: Proveer una UI en este tab para registrar un `MovimientoStock` manual (Ej. ajustes de entrada o mermas).
- [x] Task 4: Fase 6 - Integración de Rebaja Automática de Stock
  - [x] SubTask 4.1: Modificar el Server Action responsable (ej. `addItemToVenta` o la confirmación de pago de la Fase 5) para detectar ítems tipo "producto" y generar de forma transaccional un registro negativo en `movimientos_stock`.
  - [x] SubTask 4.2: Asegurar de que si un ítem de venta es eliminado (`removeVentaItem`), el stock sea revertido (movimiento positivo) correspondientemente.
- [x] Task 5: Validar la Fase 6
  - [x] SubTask 5.1: Ejecutar `npm run build` para asegurar la compilación.
  - [x] SubTask 5.2: Crear el reporte final `/.trae/documents/phase6_validation.md` validando el checklist.