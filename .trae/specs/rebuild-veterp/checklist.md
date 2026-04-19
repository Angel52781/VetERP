# Checklist de Implementación por Fases

## Fase 1: Setup, Auth y Multi-tenant Base
- [ ] Proyecto inicializado y estructura de carpetas definida.
- [ ] Base de datos conectada con esquema inicial (`User`, `Clinica`, `MembresiaClinica`).
- [ ] Flujo de registro, login y reseteo de contraseña funcional.
- [ ] Vista `select_clinica` permite elegir la clínica y setea el contexto de la sesión.
- [ ] Guard de rutas activado (redirige si no hay login o clínica activa).
- [ ] Reglas de privacidad (RLS) operativas asegurando que un usuario solo ve datos de su clínica activa.

## Fase 2: Core Data (Clientes, Mascotas, Catálogos)
- [ ] CRUD de Catálogos (Servicios, Productos, Proveedores, Tipos de Cita, Almacén) funcionando en Settings.
- [ ] Listado de Clientes y Mascotas funcional.
- [ ] Creación de Cliente y Mascota garantizando que ninguna FK obligatoria quede en null (Mitigación P0).
- [ ] Componentes modales reutilizables integrados correctamente.
- [ ] Seed data mínima inyectada en la base de datos de desarrollo.

## Fase 3: Operación Clínica (Atenciones, Agenda, Colas)
- [ ] Calendario de citas visualiza y permite crear citas correctamente.
- [ ] Vista `index` muestra el listado de órdenes de servicio abiertas.
- [ ] Vista `orden_y_colas` permite gestionar el ciclo de vida de una atención (estados).
- [ ] Adición de notas (`EntradaClinica`) y subida de archivos (`Adjunto`) funcional.
- [ ] Enums de estados de orden (`Open`, `In Progress`, `Closed`, `Cancelled`) estandarizados.
- [ ] Kanban de colas muestra correctamente los pacientes en espera.

## Fase 4: Financiero e Inventario (Caja, Kardex)
- [ ] Ítems de venta (`ItemVenta`) pueden agregarse desde la atención médica a una `Venta`.
- [ ] Vista `caja_inventario` muestra el detalle de ventas y permite registrar pagos (`Ledger`).
- [ ] El total de la venta se calcula correctamente en el backend (Mitigación P1).
- [ ] Pestaña de Inventario calcula el stock actual mediante suma de `MovimientoStock`.
- [ ] Movimientos manuales de inventario actualizan correctamente el Kardex.
- [ ] Todos los flujos validan que la `clinica_custom_clinica` se asigne automáticamente desde el backend en cada creación.
