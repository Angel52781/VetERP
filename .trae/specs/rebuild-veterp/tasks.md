# Tasks

- [x] Task 1: Fase 1 - Auth + Tenant Context + Navegación Protegida
  - [x] SubTask 1.1: Inicializar Next.js, Tailwind, shadcn/ui y Supabase.
  - [x] SubTask 1.2: Modelar y crear tablas base (`User`, `Clinica`, `MembresiaClinica`) con RLS.
  - [x] SubTask 1.3: Implementar flujos de Login, Signup, Reset Password (Supabase Auth).
  - [x] SubTask 1.4: Implementar vista `select_clinica` y manejo de estado/cookie de `clinica_id`.
  - [x] SubTask 1.5: Configurar layouts, Navbar y Middleware (Guards de rutas).

- [x] Task 2: Fase 2 - Clientes + Mascotas
  - [x] SubTask 2.1: Modelar tablas (`Cliente`, `Mascota`) con RLS.
  - [x] SubTask 2.2: Desarrollar componentes modales reutilizables para creación.
  - [x] SubTask 2.3: Desarrollar vista `clientes_mascotas` (Listado, búsqueda y detalle).

- [x] Task 3: Fase 3 - Agenda + Citas
  - [x] SubTask 3.1: Modelar tablas de catálogo (`TipoCita`) y tabla operativa (`Cita`) con RLS.
  - [x] SubTask 3.2: Integrar componente de calendario en `agenda_colas_settings`.
  - [x] SubTask 3.3: Desarrollar flujo de agendamiento (vinculando Cliente/Mascota).

- [x] Task 4: Fase 4 - Órdenes + Entradas Clínicas + Adjuntos
  - [x] SubTask 4.1: Modelar tablas (`OrdenServicio`, `EntradaClinica`, `Adjunto`, `ItemCola`).
  - [x] SubTask 4.2: Desarrollar vista `index` (Panel de Atenciones abiertas).
  - [x] SubTask 4.3: Desarrollar vista `orden_y_colas` (Detalle, Notas Clínicas).
  - [x] SubTask 4.4: Configurar Supabase Storage e implementar subida de archivos.
  - [ ] SubTask 4.5: Desarrollar tablero Kanban para Colas (`agenda_colas_settings`).

- [x] Task 5: Fase 5 - Caja + Ventas + Item Venta + Ledger
  - [x] SubTask 5.1: Modelar y migrar tablas financieras (`ItemCatalogo`, `Venta`, `ItemVenta`, `Ledger`) con RLS y tenant isolation.
  - [x] SubTask 5.2: Desarrollar UI para agregar ítems de venta desde `orden_y_colas` (con integración mínima confirmada).
  - [x] SubTask 5.3: Desarrollar cálculos seguros en backend (Server Actions) para calcular total de venta y validar registros.
  - [x] SubTask 5.4: Implementar registro de pagos (Ledger) asociado a Ventas y Clínicas.
  - [x] SubTask 5.5: Desarrollar vista `caja_inventario` enfocada exclusivamente en Caja y Ventas.
  - [x] SubTask 5.6: Desarrollar UI para el catálogo de Servicios y Productos (Crear, editar, listar `ItemCatalogo`).

- [ ] Task 6: Fase 6 - Inventario + Movimiento Stock
  - [ ] SubTask 6.1: Modelar tablas logísticas (`Proveedor`, `Almacen`, `MovimientoStock`).
  - [ ] SubTask 6.2: Desarrollar CRUD de catálogos logísticos (Settings).
  - [ ] SubTask 6.3: Desarrollar pestaña Inventario (Kardex) y lógica de suma de stock.
  - [ ] SubTask 6.4: Vincular rebaja automática de stock al procesar ventas de productos.

- [ ] Task 7: Fase 7 - Hardening + QA + Permisos
  - [ ] SubTask 7.1: Implementar RBAC basado en `MembresiaClinica.rol_text`.
  - [ ] SubTask 7.2: Revisión de seguridad y performance (Vercel Best Practices).
  - [ ] SubTask 7.3: Corrección de bugs (QA) y validaciones finales.
