# Checklist de Implementación por Fases

## Fase 1: Auth + Tenant Context + Navegación Protegida (LISTA - RECONSTRUIDA)
- [x] Proyecto Next.js inicializado con Supabase y shadcn/ui.
- [x] Base de datos conectada con esquema inicial (`User`, `Clinica`, `MembresiaClinica`).
- [x] Flujo de registro, login y reseteo de contraseña funcional.
- [x] Flujo de Onboarding: Creación de primera clínica si el usuario no tiene ninguna asignada.
- [x] Mostrar mensajes de error de autenticación en la UI (login/signup).
- [x] Vista `select_clinica` permite elegir la clínica y setea el contexto de la sesión (cookie/jwt).
- [x] Middleware activado (redirige si no hay login o clínica activa).
- [x] RLS activado asegurando que un usuario solo ve datos de su clínica activa.

## Fase 2: Clientes + Mascotas (LISTA - RECONSTRUIDA)
- [x] Listado de Clientes y Mascotas funcional.
- [x] Creación de Cliente y Mascota garantiza integridad referencial (no FKs nulas).
- [x] Componentes modales reutilizables integrados correctamente. *(Mascota-form extraído, cliente-form pendiente de refactor)*
- [x] RLS probado para evitar fuga de datos entre tenants.

## Fase 3: Agenda + Citas (LISTA)
- [x] Catálogo de Tipos de Cita implementado.
- [x] Calendario visualiza y permite crear citas correctamente.
- [x] Citas vinculadas correctamente al Cliente y la Mascota.

## Fase 4: Órdenes + Entradas Clínicas + Adjuntos (LISTA PARCIAL)
- [x] Vista `index` muestra listado de atenciones activas.
- [x] Vista `orden_y_colas` permite gestionar transiciones de estado (`Open`, `In Progress`, etc.).
- [x] Registro de notas (`EntradaClinica`) funcional.
- [x] Subida y visualización de archivos (`Adjunto`) segura vía Supabase Storage.
- [ ] Kanban de colas muestra pacientes en espera en los carriles correctos.

## Fase 5: Caja + Ventas + Item Venta + Ledger
- [ ] Catálogo de Servicios/Productos operativo.
- [ ] Ítems de venta pueden agregarse a una orden/venta.
- [ ] Vista `caja_inventario` (Caja) muestra el detalle de ventas.
- [ ] El total de la venta se calcula en el backend, mitigando riesgos P1.
- [ ] Registro de pagos (`Ledger`) funcional y sumando correctamente.

## Fase 6: Inventario + Movimiento Stock
- [ ] Catálogos de Proveedores y Almacenes operativos.
- [ ] Inventario calcula stock actual en tiempo real mediante `SUM(MovimientoStock)`.
- [ ] Movimientos manuales de ajuste reflejados en el Kardex.
- [ ] Rebaja de stock automática probada al vender ítems tipo "producto".

## Fase 7: Hardening + QA + Permisos
- [ ] Reglas de Autorización (RBAC) aplicadas en UI y Server Actions.
- [ ] Rendimiento optimizado según mejores prácticas de React.
- [ ] Seed data mínima inyectada para pruebas finales.
