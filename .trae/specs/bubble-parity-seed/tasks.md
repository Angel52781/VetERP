# Tasks

- [x] Task 1: Reestructurar Navegación y Shell Visual (Paridad B)
  - [x] SubTask 1.1: Actualizar `src/app/(operativo)/sidebar-nav.tsx` para reflejar las rutas: Atenciones (Inicio), Colas (Órdenes), Caja, Inventario, Agenda, Clientes, Settings (Ajustes).
  - [x] SubTask 1.2: Asegurar que los iconos de `lucide-react` sean consistentes y representativos para cada nueva ruta.
  - [x] SubTask 1.3: Revisar y ajustar el selector de clínica (`src/app/select-clinica/page.tsx` y su header) para que sea intuitivo y visualmente coherente.

- [x] Task 2: Inyectar Seed Data Realista (Paridad C)
  - [x] SubTask 2.1: Modificar `supabase/seed.sql` para insertar al menos 3 clientes y 5 mascotas (incluyendo dueños, especies, razas, edades).
  - [x] SubTask 2.2: Insertar en `seed.sql` al menos 5 citas distribuidas en la semana actual (pendientes, confirmadas, completadas).
  - [x] SubTask 2.3: Insertar en `seed.sql` al menos 3 órdenes de servicio con diferentes estados (abierta, en progreso, completada).
  - [x] SubTask 2.4: Expandir el catálogo en `seed.sql` a 10 ítems (mix de productos y servicios), 2 proveedores, y registrar movimientos de stock inicial.
  - [x] SubTask 2.5: Insertar datos de ventas e ingresos (`ledger`) correspondientes a las órdenes completadas.

- [x] Task 3: Refinamiento Visual de Pantallas Core (Paridad A y D)
  - [x] SubTask 3.1: Refinar la vista `inicio` (Atenciones/Dashboard) para mostrar un layout más denso y útil, combinando métricas y listas rápidas si es posible.
  - [x] SubTask 3.2: Mejorar la vista `clientes` para asegurar paridad visual con "Clientes y Mascotas", optimizando el espacio de la tabla y la información mostrada.
  - [x] SubTask 3.3: Ajustar `orden_y_colas` para mostrar claramente los ítems de venta, el estado de la orden y la información del paciente de forma compacta.
  - [x] SubTask 3.4: Refinar `agenda` (Agenda/Colas/Settings) para asegurar que se perciba como un módulo operativo completo (vista de tabla densa o listado estructurado).
  - [x] SubTask 3.5: Refinar `caja_inventario` asegurando que las pestañas o divisiones internas aprovechen bien el espacio horizontal.

- [x] Task 4: Verificación de Build y Calidad
  - [x] SubTask 4.1: Ejecutar `npm run build` para asegurar que no se introdujeron errores de compilación durante el refactor de rutas/navegación o componentes.

# Task Dependencies
- [Task 3] depends on [Task 1] (las rutas deben existir para poder refinar las pantallas).
- [Task 3] depends on [Task 2] (tener datos realistas ayuda a diseñar mejor la densidad visual y ver cómo lucen los estados llenos).
