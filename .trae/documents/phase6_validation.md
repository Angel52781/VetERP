# Validación de Fase 6: Inventario y Movimiento Stock

## 1. Checklist de Cumplimiento de Fase 6

- [x] **Migración SQL (`0006_inventario.sql`)**: Ejecutada y verificada. Define correctamente las tablas `almacenes` y `movimientos_stock`.
- [x] **Integridad Referencial**: Asegurada mediante `ON DELETE CASCADE` hacia `clinicas` e `items_catalogo`, además de utilizar la preexistente tabla `proveedores`.
- [x] **RLS de Entidades**: `Proveedor` (previa), `Almacen` y `MovimientoStock` cuentan con Row Level Security basado en la membresía de la clínica (`clinica_id`).
- [x] **CRUD de Proveedor y Almacén en `/ajustes`**: Implementado con validadores Zod, UI (`proveedores-client.tsx`, `almacenes-client.tsx`) y Server Actions en `actions.ts`.
- [x] **Server Actions de Inventario y Stock**: `getInventario` y `addMovimientoStock` desarrolladas de manera funcional y segura.
- [x] **Cálculo de Stock Actual**: Implementado agrupando dinámicamente la sumatoria de movimientos (`SUM(qty)`) sobre `movimientos_stock`, sin usar una columna estática modificable.
- [x] **Flujo de Ajuste Manual**: Formulario en el tab de Inventario operativo, que inserta movimientos (entradas o salidas) de forma directa.
- [x] **Rebaja Automática de Stock**: Agregada la lógica transaccional en `addItemToVenta` para insertar un movimiento negativo (tipo `"venta"`) cuando el `ItemCatalogo.kind === "producto"`.
- [x] **Reversión de Stock**: Implementado correctamente en `removeVentaItem` insertando un movimiento positivo (tipo `"reversion_venta"`) al quitar un producto de la venta.
- [x] **Rutas y Páginas**: Pestañas funcionales tanto en `/ajustes` como en `/caja_inventario`.
- [x] **Aislamiento Multi-Tenant**: Inyectado de manera forzosa mediante `requireClinicaIdFromCookies()` en todas las acciones.
- [x] **Coherencia con Fases 1 a 5**: Arquitectura preservada (shadcn/ui, Server Actions, Supabase Auth).
- [x] **Construcción (`npm run build`)**: Pasa exitosamente (0 errores de tipado o compilación).

## 2. Errores o Riesgos Detectados

- **Riesgo de Rendimiento a Futuro (Bajo/Medio)**: Actualmente el stock actual (`getInventario`) se calcula descargando todos los movimientos de stock de la clínica y agrupándolos en JavaScript (debido a limitaciones actuales en PostgREST para hacer `GROUP BY` sin RPC). **Mitigación**: Esto es funcional y correcto para la Fase 6, pero si el volumen de datos crece significativamente, será necesario refactorizar la lógica hacia un *Stored Procedure (RPC)* o una vista en la base de datos para delegar el cálculo al motor SQL.
- **Supuesto de Almacén por Defecto**: Para la rebaja automática de inventario durante las ventas, el sistema asigna el stock descontado a un almacén por defecto (o el primero que encuentre). Si no existe ninguno, crea uno dinámicamente. Este supuesto es robusto y previene errores en tiempo de ejecución.

## 3. Archivos Clave que implementan Fase 6

- **Base de Datos**: `supabase/migrations/0006_inventario.sql`
- **Esquemas y Tipos**: `src/lib/validators/ajustes.ts`
- **Backend (Server Actions)**: 
  - `src/app/(operativo)/ajustes/actions.ts` (CRUD Almacén y Proveedor)
  - `src/app/(operativo)/caja_inventario/actions.ts` (Rebaja de Stock en Ventas y `getInventario`)
- **Frontend**: 
  - `src/app/(operativo)/ajustes/proveedores-client.tsx`
  - `src/app/(operativo)/ajustes/almacenes-client.tsx`
  - `src/app/(operativo)/caja_inventario/inventario-list.tsx`

## 4. Qué Está Correcto

- El diseño "inmutable" del inventario (event sourcing/Kardex). El stock nunca se "actualiza" (`UPDATE`), sino que se calcula sumando entradas y salidas (`INSERT`). Esta es la práctica más segura y auditable.
- El RLS y el chequeo constante de `clinica_id` que protegen la información entre inquilinos.
- Las referencias en cascada que garantizan que el inventario no deje registros huérfanos.

## 5. Qué Falta o Qué Está Flojo

- No se han agregado filtros de fecha o paginación en el listado de Movimientos (Kardex detallado) ni en el listado de Proveedores/Almacenes, asumiendo un volumen de datos inicial manejable.
- Faltan permisos de usuario (RBAC). Actualmente, cualquier usuario de la clínica activa puede modificar inventario. Esto está explícitamente reservado para la **Fase 7**.

## 6. Decisión Final

**FASE 6: LISTA**
La Fase 6 ha sido construida de manera íntegra, segura y coherente con los lineamientos del proyecto. Pasa el proceso de compilación sin problemas y todos los flujos de inventario, incluyendo el descuento automatizado por venta, funcionan según la especificación.
