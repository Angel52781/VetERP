# VetERP Rebuild Spec

## 1. Resumen Ejecutivo del Producto
VetERP es una aplicación web responsiva diseñada para la gestión operativa de clínicas veterinarias multi-sucursal. El sistema abarca el ciclo completo de atención clínica, desde el agendamiento y recepción de pacientes (mascotas y dueños), hasta el registro de notas clínicas, colas de atención, facturación (caja) y control de inventario (kardex). La reconstrucción busca migrar la plataforma original (construida en Bubble.io) hacia un stack moderno, resolviendo problemas estructurales de seguridad, multi-tenancy y calidad de datos.

## 2. Módulos Funcionales
El sistema se divide en 6 módulos principales:
- **Autenticación y Sesión**: Manejo de acceso, registro, recuperación de contraseña y selección de clínica activa (tenant).
- **Panel de Atenciones (Órdenes de Servicio)**: Creación, seguimiento y gestión de atenciones clínicas en curso.
- **Clientes y Mascotas**: Directorio y CRUD de propietarios y sus animales.
- **Caja e Inventario**: Registro de ventas, pagos, control de stock y kardex de movimientos.
- **Agenda y Colas**: Calendario de citas y tableros (Kanban) para flujo de pacientes (ej. médica, grooming).
- **Configuración y Catálogos**: Administración de servicios, productos, proveedores y tipos de cita.

## 3. Mapa de Navegación
**A) Páginas Públicas:**
- `select_clinica` (Punto de entrada inicial para selección de tenant o login).
- `reset_pw` (Restablecimiento de contraseña).
- `404` (Página no encontrada).

**B) Páginas Operativas (Protegidas por Guard):**
- `index` (Panel principal de atenciones).
- `clientes_mascotas` (Directorio).
- `orden_y_colas` (Detalle profundo de una atención).
- `caja_inventario` (Finanzas y stock).
- `agenda_colas_settings` (Agenda, Kanban de colas y configuración).

## 4. Sistema de Autenticación y Acceso
El sistema se basa en 4 estados de usuario:
1. **Logged out**: Redirigido a login o `select_clinica`.
2. **Logged in sin MembresiaClinica**: Redirigido a `select_clinica` (riesgo de quedar atrapado si no hay clínicas disponibles).
3. **Logged in con MembresiaClinica pero sin clínica activa**: Redirigido a `select_clinica` para elegir el tenant de la sesión.
4. **Logged in con MembresiaClinica y clínica activa**: Acceso permitido a las páginas operativas.

**Guard (Regla de acceso confirmada):**
Toda página operativa verifica los 3 estados iniciales (On Page Load). Si el usuario cae en cualquiera de ellos, es redirigido a `select_clinica`.

## 5. Modelo de Datos
*A = Confirmado, C = No Confirmado / Inferido*

- **User**: `email` (A), `clinica_activa_custom_clinica` (A).
- **Clinica**: `nombre_text` (A), `ciudad_text` (A), `activa_boolean` (A). *Dirección/RUC/Teléfono (C)*.
- **MembresiaClinica**: `user_user` (A), `clinica_custom_clinica` (A), `rol_text` (C), `permisos_list_text` (C).
- **Cliente**: `nombre_text` (A), `telefono_text` (A), `email_text` (A), `clinica` (A).
- **Mascota**: `nombre_text` (A), `especie_text` (A), `raza_text` (A), `dueno` (A), `clinica` (A).
- **OrdenServicio**: `estado_text` (A - solo "Open" confirmado), `dueno` (A), `mascota` (A), `staff_user` (A), `created_at_date` (A), `started_at_date` (A), `finished_at_date` (A), `clinica` (A).
- **EntradaClinica**: `tipo_text` (A), `texto_text` (A), `fecha_date` (A), `autor_user` (A), `orden` (A), `clinica` (A).
- **Adjunto**: `archivo_file` (A), `descripcion_text` (A), `fecha_date` (A), `orden` (A), `clinica` (A). *Autor (C)*.
- **ItemCola**: `carril_text` (C), `indice_number` (A), `orden` (A), `clinica` (A).
- **Cita**: `start_date` (A), `end_date` (A), `estado_text` (C), `cliente` (A), `mascota` (A), `tipo_cita` (A), `orden_link` (A), `clinica` (A).
- **TipoCita**: `nombre_text` (A), `duracion_min_number` (A), `color_text` (A), `is_disabled_boolean` (A), `clinica` (A).
- **ItemCatalogo**: `nombre_text` (A), `descripcion_text` (A), `kind_text` (A - "producto" o "servicio"), `precio_inc_number` (A), `is_disabled_boolean` (A), `proveedor` (A), `clinica` (A).
- **Proveedor**: `nombre_text` (A), `contacto_text` (A), `telefono_text` (A), `clinica` (A).
- **Almacen**: `nombre_text` (A), `is_default_boolean` (A), `clinica` (A).
- **MovimientoStock**: `qty_number` (A), `motivo_text` (C), `fecha_date` (A), `item` (A), `almacen` (A), `ref_venta` (A), `clinica` (A).
- **Venta**: `estado_text` (C), `total_number` (A), `created_at_date` (A), `created_by_user` (A), `cliente` (A), `orden` (A), `clinica` (A).
- **ItemVenta**: `cant_number` (A), `precio_unit_number` (A), `total_linea_number` (A), `item` (A), `venta` (A). *(Nota: ItemVenta hereda el tenant a través de Venta)*.
- **Ledger**: `tipo_text` (A - "pago" confirmado), `monto_number` (A), `fecha_date` (A), `cliente` (A), `ref_venta` (A), `orden` (A), `clinica` (A).

## 6. Reglas Multi-Tenant
- **Aislamiento Base**: Toda entidad (salvo `User` e `ItemVenta`) debe contener una clave foránea a `Clinica`.
- **Resolución del Tenant**: Las consultas y mutaciones se filtran obligatoriamente por el valor almacenado en `User.clinica_activa_custom_clinica`.
- **Riesgo Mitigado**: La aplicación original carecía de reglas a nivel de servidor (Privacy Rules) para el multitenancy, confiando solo en filtros de UI. La reconstrucción **DEBE** implementar aislamiento estricto en el backend (Row-Level Security o equivalente).

## 7. Reglas de Autorización
- **A) Confirmado**: `User` tiene reglas estrictas (los usuarios no pueden ver los perfiles de otros libremente, solo el propio). Los demás tipos de datos en la app original **no tenían** reglas de privacidad a nivel servidor.
- **C) No Confirmado / Inferido**: Aunque existe el campo `MembresiaClinica.rol_text` y `permisos_list_text`, no hay evidencia de su uso sistemático para restringir vistas o acciones.
- **Decisión para Reconstrucción**: Implementar RBAC (Role-Based Access Control) básico derivado de `MembresiaClinica.rol_text`, bloqueando accesos a configuración o caja según sea necesario.

## 8. Seed Data Mínima
Para inicializar el sistema se requiere el siguiente orden de inserción:
1. `Clinica` (Ej. Clínica Demo).
2. `User` (Usuario administrador).
3. `MembresiaClinica` (Vincular usuario a la clínica).
4. `Almacen` (Almacén principal por defecto).
5. `Proveedor` (Al menos uno genérico).
6. `ItemCatalogo` (Servicios básicos como "Consulta General" y productos).
7. `TipoCita` (Ej. "Consulta", "Peluquería").
8. `Cliente` y `Mascota` (Datos de prueba).
*Post-login, el sistema debe asegurar que `User.clinica_activa` se asigne a la clínica demo.*

## 9. Flujos Críticos del Negocio
1. **Onboarding / Acceso**: Usuario entra → (Si no logueado) Login modal → Redirigido a `select_clinica` → Selecciona clínica → `User.clinica_activa` actualizada → Redirigido a `index`.
2. **Atención (End-to-End)**: `index` (Nueva OrdenServicio) → `orden_y_colas` (Añadir notas, adjuntos, enviar a cola) → `orden_y_colas` (Añadir ítems de caja a la orden) → `caja_inventario` (Registrar pago en Ledger vinculado a la venta).
3. **Agendamiento**: `agenda_colas_settings` (Crear Cita con Cliente, Mascota y TipoCita) → Visualización en calendario.
4. **Inventario**: `agenda_colas_settings` (Crear Producto/Proveedor) → `caja_inventario` (Ver kardex, registrar MovimientoStock manual o automático vía Venta).

## 10. Lista de Páginas/Vistas a Reconstruir
- **Auth & Entry**: `select_clinica`, `reset_pw`, modales de Login/Signup.
- **Dashboard Operativo**: `index` (Panel principal).
- **Directorio**: `clientes_mascotas` (Pestañas para clientes y mascotas).
- **Clínica / Médica**: `orden_y_colas` (Vista detallada de la atención con pestañas para resumen, notas, adjuntos, caja).
- **Finanzas y Stock**: `caja_inventario` (Pestañas para ventas/pagos y kardex de inventario).
- **Planificación y Configuración**: `agenda_colas_settings` (Calendario, Kanban de colas, mantenedores de catálogos).

## 11. Componentes Reutilizables
*La aplicación original sufría de alta duplicación. La reconstrucción centralizará:*
- **Layouts**: Navbar Desktop y Navbar Mobile (con selector de clínica activa).
- **Modales/Popups Compartidos**:
  - Auth (Login / Signup).
  - Formularios de Creación (Nueva Atención, Agendar Cita, Nuevo Cliente/Mascota).
  - Componentes de interacción (Agregar Ítem a Caja, Subir Adjunto).

## 12. Riesgos / Dudas / Contradicciones y Resoluciones

### Contradicciones Resueltas (A)
1. **Guards de Acceso**: La versión inicial indicaba falta de guards, pero la auditoría final **confirma** la existencia de 3 checks en páginas operativas. *Se implementarán guards estrictos en el enrutador.*
2. **Privacy Rules**: Se reportaban como "No Auditadas", luego se **confirma** que estaban ausentes. *Se implementará RLS real.*
3. **Estados de OrdenServicio**: Había descripciones en UI ("Abierta/En Progreso"), pero a nivel de DB solo se confirmó `"Open"` en creación. *Se estandarizarán los estados en el backend.*

### Huecos de Información (C - No Confirmado / Decisiones a Tomar)
1. **Destino de Redirect Post-Logout**: No está claro a dónde iban ciertas páginas tras el logout. *Decisión: Todo logout redirigirá a `/` o `/login`.*
2. **Valores de Enums**: `Ledger.tipo_text` (solo "pago" confirmado), `ItemCola.carril_text`, `MovimientoStock.motivo_text`. *Decisión: Se definirán enums estáticos canónicos en el backend (ej. pago/cargo, entrada/salida).*
3. **Signo en Ledger**: No hay confirmación si pagos son positivos o negativos. *Decisión: Todo monto se almacenará como positivo absoluto y el tipo de transacción definirá la suma/resta.*

### Riesgos Críticos a Mitigar
- **Corrupción de Datos (P0)**: Registros con `clinica = null` o FK nulas (`Mascota.dueno = null`, `ItemVenta.venta = null`, `EntradaClinica.orden = null`). *Solución: Validación estricta a nivel de esquema (NOT NULL) en la base de datos.*
- **Financieros (P1)**: `Venta.total = 0` constante o `Ledger.monto` vacío por fallos de UI. *Solución: Totales calculados en backend (triggers o funciones).*
- **Timestamps Muertos**: Fechas de inicio/fin de orden de servicio no se actualizaban. *Solución: Actualización automática basada en cambios de estado de la orden.*
