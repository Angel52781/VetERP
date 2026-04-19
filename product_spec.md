# VetERP — product_spec.md (especificación de producto para migración)

## Índice
1. Propósito del producto
2. Alcance y no-alcance (estado actual)
3. Actores, sesión y multi-sucursal
4. Módulos
5. Páginas (catálogo) y responsabilidades
6. Navegación y piezas compartidas
7. Reglas de acceso (guards) y estados de usuario
8. Flujos principales de usuario (end-to-end)
9. Reglas de negocio (implícitas / confirmadas)
10. Limitaciones conocidas (sin rediseño)

---

## 1) Propósito del producto

VetERP es una **aplicación web** (Bubble.io) para gestión operativa de clínicas veterinarias **multi-sucursal** (multi-tenant por clínica). Cubre:
- atenciones (órdenes de servicio),
- clientes y mascotas,
- agenda/citas,
- caja (ventas/pagos) e inventario,
- configuración/catálogos (servicios, productos, proveedores, tipos de cita).

**Evidencia:** “AUDITORÍA MAESTRA — VetERP (Bubble.io)” + secciones de módulos/páginas.

---

## 2) Alcance y no-alcance (estado actual)

### 2.1 En alcance (confirmado por auditoría)
- Web app responsive (Bubble.io).
- Autenticación con acciones nativas Bubble: `LogIn / SignUp / LogOut / ResetPassword`.
- Multi-tenant por entidad `Clinica` y “clínica activa” en `User`.

### 2.2 Fuera de alcance / ausente (según auditoría)
- **App mobile nativa:** NO EXISTE (solo “Mobile View: Home” fuera de auditoría).
- **Reusable elements:** NO EXISTEN (duplicaciones por página).
- **Backend workflows / API workflows:** NO EXISTEN.
- **Option Sets:** NO EXISTEN.

**Evidencia:** “SECCIÓN 0 — CONTEXTO TÉCNICO GLOBAL” (auditoría maestra).

---

## 3) Actores, sesión y multi-sucursal

### 3.1 Actor principal
- **Usuario autenticado** que opera el sistema (staff / recepcionista / admin, etc.).  
  **NO CONFIRMADO:** catálogo real de roles y su enforcement en UI/acciones (hay `MembresiaClinica.rol_text` pero el set de valores y la lógica de permisos no están confirmados).

### 3.2 Relación Usuario ↔ Clínica (multi-sucursal)
- Un `User` puede asociarse a una o más clínicas vía `MembresiaClinica`.
- En cada sesión el usuario trabaja contra **una clínica activa** (`User.clinica_activa_custom_clinica`).

**Evidencia:** auditoría maestra (multitenancy) + data model (`MembresiaClinica` y `User`).

---

## 4) Módulos

Según la auditoría, existen **6 módulos funcionales**:
1. **Autenticación y sesión** (login/signup/logout, selección de clínica activa).
2. **Panel de atenciones (Órdenes de Servicio)** (listado + detalle + colas).
3. **Clientes y mascotas** (CRUD + fichas + accesos rápidos).
4. **Caja e inventario** (ventas, pagos, kardex, ajustes).
5. **Agenda y colas** (citas y vista tipo kanban).
6. **Configuración / catálogos** (servicios, productos, proveedores, tipos de cita).

**Evidencia:** “SECCIÓN 3 — MÓDULOS FUNCIONALES Y SUS PÁGINAS”.

---

## 5) Páginas (catálogo) y responsabilidades

### 5.1 Lista completa de páginas web (8)
- `index`
- `select_clinica`
- `clientes_mascotas`
- `orden_y_colas`
- `caja_inventario`
- `agenda_colas_settings`
- `reset_pw`
- `404`

**Evidencia:** “SECCIÓN 1 — MAPA COMPLETO DE PÁGINAS”.

### 5.2 `index` — Panel de Atenciones
- Lista y búsqueda de `OrdenServicio` (con saldo por SUM de `Ledger`).
- Acciones rápidas por orden:
  - cambiar estado,
  - abrir resumen / notas,
  - enviar a cola (médica/grooming),
  - agendar cita,
  - crear nueva atención (OrdenServicio).
- Selector de clínica activa en navbar (ChangeThing sobre `CurrentUser`).
- Popups: login, signup, nueva atención, ficha cliente, resumen orden, notas, agendar cita.
- **BUG reportado:** popup “Agregar Item” en `index` no guarda (`HideElement + ResetInputs` sin `NewThing`).

**Evidencia:** “SECCIÓN 4.1 PAGE: index”.

### 5.3 `select_clinica` — Selección de clínica activa (entrada)
- Para usuario autenticado: muestra RG de `Clinica` y permite setear `User.clinica_activa_custom_clinica` y navegar a `index`.
- Para usuario no autenticado: muestra popup login automáticamente (según auditoría de navegación/acceso).
- Popups: login, signup.

**Evidencia:** “SECCIÓN 4.2 PAGE: select_clinica” + “SISTEMA DE NAVEGACIÓN, ACCESO Y SESIÓN”.

### 5.4 `clientes_mascotas` — Directorio (CRUD)
- Tabs: Clientes / Mascotas.
- CRUD de `Cliente` y `Mascota`.
- Permite agendar `Cita` y crear `OrdenServicio` desde fichas.
- Nota: navbar con iconset mixto (migración incompleta de íconos).

**Evidencia:** “SECCIÓN 4.3 PAGE: clientes_mascotas”.

### 5.5 `orden_y_colas` — Detalle de atención
- Pantalla clínica principal: selector de orden + detalle con tabs:
  - resumen,
  - entradas clínicas (`EntradaClinica`),
  - adjuntos (`Adjunto`),
  - items de caja (`ItemVenta`) y totales/pagado/saldo.
- Acciones de estado de orden vía botones directos (cambian `estado_text`).
- Popups: nueva atención, nueva nota, subir archivo, agregar item caja (sí guarda), asignar staff, fichas.

**Evidencia:** “SECCIÓN 4.4 PAGE: orden_y_colas”.

### 5.6 `caja_inventario` — Caja + Inventario
- Tab Ventas:
  - RG de `Venta`, anulación (ChangeThing estado),
  - detalle con items (`ItemVenta`), pagos (`Ledger`) e historial.
- Tab Inventario:
  - RG de `ItemCatalogo` con stock calculado por SUM de `MovimientoStock.qty`,
  - kardex por producto,
  - ajustes / movimiento manual (NewThing MovimientoStock).
- Crea encabezado de `Venta` (sin ítems inline confirmados en esa acción).

**Evidencia:** “SECCIÓN 4.5 PAGE: caja_inventario”.

### 5.7 `agenda_colas_settings` — Agenda + Colas + Settings
Página triple con tabs:
- **Agenda:** RG de `Cita` (creación + edición de estado).
- **Colas:** dos sub-tabs (médica y grooming), vista tipo kanban (con limitaciones reportadas).
- **Settings:** sub-tabs para CRUD de:
  - `ItemCatalogo` (servicios / productos),
  - `Proveedor`,
  - `TipoCita`.

**Evidencia:** “SECCIÓN 4.6 PAGE: agenda_colas_settings”.

### 5.8 `reset_pw`
Flujo nativo de restablecimiento de contraseña.

**Evidencia:** “SECCIÓN 4.7 PAGE: reset_pw”.

### 5.9 `404`
Página estándar de error.

**Evidencia:** “SECCIÓN 4.8 PAGE: 404”.

---

## 6) Navegación y piezas compartidas

### 6.1 Navegación principal
La navbar está presente en páginas operativas (y en `index`/`select_clinica`), con accesos a:
- Atenciones, Colas, Caja/Inventario, Agenda, Clientes, Settings.

**Evidencia:** “SECCIÓN 5 — FLUJO GENERAL ENTRE PÁGINAS”.

### 6.2 Piezas duplicadas (no reusable)
Según la auditoría, se duplican (copias independientes) entre páginas:
- Navbar Desktop (FontAwesome)
- Navbar Mobile (FontAwesome)
- Popup Login
- Popup Signup
- Popup “Nueva Atención” (con comportamientos distintos)
- Popup “Agendar Cita”
- Popups de ficha cliente/mascota en algunas páginas

Implicación: cambios funcionales/UI requieren réplica manual en múltiples páginas.

**Evidencia:** “SECCIÓN 6 — PIEZAS COMPARTIDAS ENTRE PÁGINAS”.

---

## 7) Reglas de acceso (guards) y estados de usuario

> Nota: existen contradicciones entre secciones “tempranas” y secciones posteriores sobre si hay guards. Según la regla del usuario, se toma como verdad el **estado más reciente** (ver `migration_risks.md`).

### 7.1 Estados de usuario usados por el sistema
1. **Logged out** (no autenticado)
2. **Logged in sin MembresiaClinica**
3. **Logged in con MembresiaClinica pero sin clínica activa**
4. **Logged in con MembresiaClinica y clínica activa**

### 7.2 Guard (Page is Loaded) en páginas operativas (estado más reciente)
En páginas operativas (`index`, `orden_y_colas`, `clientes_mascotas`, `caja_inventario`, `agenda_colas_settings`) se reporta un workflow “Page is Loaded” con 3 checks:
1. Si `CurrentUser` no está logueado → ChangePage a `select_clinica`
2. Si logueado y `Search(MembresiaClinica where user=CurrentUser):count = 0` → ChangePage a `select_clinica`
3. Si logueado y `CurrentUser.clinica_activa... is empty` → ChangePage a `select_clinica`

**Evidencia:** “AUDITORÍA — SISTEMA DE NAVEGACIÓN, ACCESO Y SESIÓN” (guards y condiciones exactas).

### 7.3 Comportamiento de `select_clinica`
- Si logged out: Page is Loaded hace `ShowElement(popup login)` (no redirect).
- Logout en `select_clinica`: LogOut sin ChangePage (divergencia).

**Evidencia:** secciones “flujo completo de entrada” + “comportamiento del logout”.

---

## 8) Flujos principales de usuario (end-to-end)

### 8.1 Entrada (usuario no autenticado → operativo con clínica activa)
1. Usuario llega a `select_clinica` (o a una página operativa y es redirigido).
2. Abre login (auto en `select_clinica` cuando logged out).
3. LogIn.
4. Selecciona clínica en RG de `Clinica`.
5. Se guarda `User.clinica_activa_custom_clinica`.
6. ChangePage a `index`.

**Evidencia:** “FLUJO COMPLETO DE ENTRADA DE UN USUARIO” + “workflow que guarda clinica_activa”.

### 8.2 Flujo de atención (happy path)
1. `index`: crear `OrdenServicio` (Nueva Atención).
2. `index` / `orden_y_colas`: enviar a cola (crea `ItemCola`).
3. `agenda_colas_settings` (tab Colas): visualizar cola (limitaciones reportadas).
4. `orden_y_colas`: agregar `EntradaClinica`, `Adjunto`, `ItemVenta`; actualizar estado.
5. `caja_inventario`: ver venta/pagos y registrar pago (`Ledger`).

**Evidencia:** “SECCIÓN 5 — FLUJO GENERAL ENTRE PÁGINAS” + descripciones por página.

### 8.3 Flujo de agenda (citas)
1. `index` o `clientes_mascotas`: agendar (NewThing `Cita`).
2. `agenda_colas_settings` (tab Agenda): ver y gestionar citas (incluye editar estado).

**Evidencia:** flujo general + página agenda_colas_settings.

### 8.4 Flujo de inventario
1. `agenda_colas_settings` (Settings): crear/editar `Proveedor`, `ItemCatalogo`, `TipoCita`.
2. `caja_inventario` (Inventario): ver stock (SUM `MovimientoStock.qty`), kardex, ajustes.

**Evidencia:** páginas caja_inventario y agenda_colas_settings.

---

## 9) Reglas de negocio (implícitas / confirmadas)

> Solo se listan reglas observadas explícitamente en la auditoría. Cualquier convención no respaldada se marca `NO CONFIRMADO`.

### 9.1 Multi-tenancy
- El alcance de datos se filtra por `CurrentUser.clinica_activa_custom_clinica` y campos `clinica_custom_clinica` en entidades.

### 9.2 Estados de atención (OrdenServicio)
- Estado de flujo (como intención de UI): Open → In Progress → Done | Cancelled.
- **Valores escritos confirmados por workflows (creación):** `"Open"`.
- Estados adicionales en datos: **NO CONFIRMADO** (pueden existir por UI/acciones, pero requieren verificación).

### 9.3 Stock (inventario)
- Stock actual de un producto = **SUM(`MovimientoStock.qty_number`)** filtrado por item (y almacén en algunas vistas).
- Convención de signo: entradas positivas y salidas negativas (reportado como regla).

### 9.4 Financiero
- Saldo del cliente = **SUM(`Ledger.monto_number`)** por cliente.
- Saldo de venta = `Venta.total_number` − SUM(Ledger.monto where ref_venta = venta).
- `Ledger.tipo_text`: `"pago"` confirmado; otros tipos NO CONFIRMADOS.

### 9.5 Catálogo (servicios/productos)
- `ItemCatalogo.kind_text` unifica productos y servicios.
- Valores confirmados: `"producto" | "servicio"`.
- Soft-delete por `is_disabled_boolean = true`.

**Evidencia:** secciones de reglas de negocio / seed / auditoría de enums.

---

## 10) Limitaciones conocidas (sin rediseño)

- Duplicación extensiva de UI y popups entre páginas (sin reusable elements).
- Enums relevantes almacenados como texto libre (con datos potencialmente sucios).
- Riesgo multi-tenant alto si faltan enforcement server-side (privacy rules ausentes fuera de `User`).
- Vista Kanban de colas con limitaciones reportadas (lecturas tipo `first_element` / no repetidores por columna).

**Evidencia:** auditoría maestra + auditoría de enums + secciones de navegación/riesgos.

