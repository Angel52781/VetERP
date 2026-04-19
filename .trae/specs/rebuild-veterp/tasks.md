# Tasks

- [ ] Task 1: Configurar la base del proyecto y enrutamiento
  - [ ] SubTask 1.1: Inicializar repositorio y dependencias base (frontend/backend).
  - [ ] SubTask 1.2: Configurar layouts y sistema de navegación (Navbar, Guards de rutas).
  - [ ] SubTask 1.3: Configurar la página 404.

- [ ] Task 2: Implementar el sistema de autenticación y multi-tenancy
  - [ ] SubTask 2.1: Modelar y crear tablas base (`User`, `Clinica`, `MembresiaClinica`).
  - [ ] SubTask 2.2: Implementar flujos de Login, Signup, Reset Password.
  - [ ] SubTask 2.3: Implementar la vista `select_clinica` y lógica de clínica activa (tenant context).
  - [ ] SubTask 2.4: Configurar RLS (Row-Level Security) o filtros a nivel de base de datos para multi-tenancy.

- [ ] Task 3: Implementar el módulo de Configuración y Catálogos (`agenda_colas_settings`)
  - [ ] SubTask 3.1: Modelar tablas (`ItemCatalogo`, `Proveedor`, `TipoCita`, `Almacen`).
  - [ ] SubTask 3.2: Desarrollar interfaces CRUD (Mantenedores) en la pestaña Settings.
  - [ ] SubTask 3.3: Poblar con Seed Data Mínima.

- [ ] Task 4: Implementar el módulo de Clientes y Mascotas (`clientes_mascotas`)
  - [ ] SubTask 4.1: Modelar tablas (`Cliente`, `Mascota`).
  - [ ] SubTask 4.2: Desarrollar el listado y búsqueda (Directorio).
  - [ ] SubTask 4.3: Desarrollar modales/formularios para creación y edición.

- [ ] Task 5: Implementar el módulo de Agenda (`agenda_colas_settings`)
  - [ ] SubTask 5.1: Modelar tabla (`Cita`).
  - [ ] SubTask 5.2: Integrar componente de calendario.
  - [ ] SubTask 5.3: Desarrollar flujo para agendar nuevas citas (modal compartido).

- [ ] Task 6: Implementar el Panel de Atenciones (`index` y `orden_y_colas`)
  - [ ] SubTask 6.1: Modelar tablas (`OrdenServicio`, `EntradaClinica`, `Adjunto`, `ItemCola`).
  - [ ] SubTask 6.2: Desarrollar la vista `index` (Listado de órdenes y botón Nueva Atención).
  - [ ] SubTask 6.3: Desarrollar la vista `orden_y_colas` (Detalle de atención, Resumen, Notas Clínicas).
  - [ ] SubTask 6.4: Implementar subida de archivos (Adjuntos).
  - [ ] SubTask 6.5: Implementar tableros Kanban para Colas en `agenda_colas_settings`.

- [ ] Task 7: Implementar el módulo de Caja e Inventario (`caja_inventario`)
  - [ ] SubTask 7.1: Modelar tablas (`Venta`, `ItemVenta`, `Ledger`, `MovimientoStock`).
  - [ ] SubTask 7.2: Desarrollar la interfaz de registro de ítems a la caja (desde `orden_y_colas`).
  - [ ] SubTask 7.3: Desarrollar la pestaña Ventas/Caja y registro de pagos (`Ledger`).
  - [ ] SubTask 7.4: Desarrollar la pestaña Inventario (Kardex) y lógica de stock (SUM).
  - [ ] SubTask 7.5: Validar que totales y cálculos financieros se procesen en backend para evitar errores (P0/P1 resueltos).
