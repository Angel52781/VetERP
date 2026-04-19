# VetERP — data_model.md (modelo de datos y reglas de datos)

## Índice
1. Visión general (multi-tenant)
2. Entidades (data types) y campos
3. Relaciones y dependencias
4. Enums implícitos (texto libre) y valores observados
5. Privacy rules (Bubble)
6. Seed mínima para reconstrucción
7. Notas de integridad y observaciones

---

## 1) Visión general (multi-tenant)

- **Plataforma origen:** Bubble.io (web app).
- **Entidad raíz:** `Clinica`.
- **Multi-tenancy (patrón):** la mayoría de data types operativos incluyen un campo `clinica_custom_clinica → custom.clinica`, y la app filtra por la **clínica activa** del usuario.
- **Clínica activa por usuario:** `User.clinica_activa_custom_clinica → custom.clinica`.

**Evidencia:** BLOQUE “DATA MODEL — TIPOS DE DATOS PERSONALIZADOS” + secciones posteriores de “Seed mínima / Reglas de negocio”.

---

## 2) Entidades (data types) y campos

> Convención: los nombres se mantienen **exactamente** como aparecen en la auditoría.  
> **Estado**: `CONFIRMADO` si aparece en el bloque de schema (data model). Si algo se menciona en otra parte pero no aparece en schema, se marca `NO CONFIRMADO`.

### 2.1 `User` (nativo Bubble, extendido)

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `email` | `text` | Campo nativo Bubble | CONFIRMADO |
| `clinica_activa_custom_clinica` | `custom.clinica` | Clínica activa “de sesión” | CONFIRMADO |

**Privacy rules (solo User tiene rules explícitas en auditoría):** ver sección 5.

### 2.2 `Clinica`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `nombre_text` | `text` | | CONFIRMADO |
| `ciudad_text` | `text` | | CONFIRMADO |
| `activa_boolean` | `boolean` | | CONFIRMADO |

**NO CONFIRMADO:** dirección, RUC, teléfono, logo (mencionado como ausente en auditoría).

### 2.3 `MembresiaClinica`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `user_user` | `user` | Relación a `User` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Relación a `Clinica` | CONFIRMADO |
| `rol_text` | `text` | Texto libre | CONFIRMADO |
| `permisos_list_text` | `list of text` | Lista libre de permisos | CONFIRMADO |

### 2.4 `Cliente`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `nombre_text` | `text` | | CONFIRMADO |
| `telefono_text` | `text` | | CONFIRMADO |
| `email_text` | `text` | | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.5 `Mascota`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `nombre_text` | `text` | | CONFIRMADO |
| `especie_text` | `text` | Texto libre | CONFIRMADO |
| `raza_text` | `text` | Texto libre | CONFIRMADO |
| `dueno_custom_cliente` | `custom.cliente` | FK a `Cliente` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.6 `OrdenServicio`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `estado_text` | `text` | Estado (texto) | CONFIRMADO |
| `dueno_custom_cliente` | `custom.cliente` | FK a `Cliente` | CONFIRMADO |
| `mascota_custom_mascota` | `custom.mascota` | FK a `Mascota` | CONFIRMADO |
| `staff_user` | `user` | Usuario asignado (staff) | CONFIRMADO |
| `created_at_date` | `date` | | CONFIRMADO |
| `started_at_date` | `date` | No siempre se asigna (ver riesgos) | CONFIRMADO |
| `finished_at_date` | `date` | No siempre se asigna (ver riesgos) | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.7 `EntradaClinica`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `tipo_text` | `text` | Texto libre (input) | CONFIRMADO |
| `texto_text` | `text` | Contenido de la entrada | CONFIRMADO |
| `fecha_date` | `date` | | CONFIRMADO |
| `autor_user` | `user` | Autor | CONFIRMADO |
| `orden_custom_ordenservicio` | `custom.ordenservicio` | FK a `OrdenServicio` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.8 `Adjunto`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `archivo_file` | `file` | Archivo (Bubble Storage) | CONFIRMADO |
| `descripcion_text` | `text` | | CONFIRMADO |
| `fecha_date` | `date` | | CONFIRMADO |
| `orden_custom_ordenservicio` | `custom.ordenservicio` | FK a `OrdenServicio` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

**NO CONFIRMADO:** autor del adjunto (auditoría lo reporta como ausente).

### 2.9 `ItemCola`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `carril_text` | `text` | Carril/cola (texto) | CONFIRMADO |
| `indice_number` | `number` | Orden en cola | CONFIRMADO |
| `orden_custom_ordenservicio` | `custom.ordenservicio` | FK a `OrdenServicio` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.10 `Cita`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `start_date` | `date` | | CONFIRMADO |
| `end_date` | `date` | | CONFIRMADO |
| `estado_text` | `text` | Estado (texto) | CONFIRMADO |
| `cliente_custom_cliente` | `custom.cliente` | FK a `Cliente` | CONFIRMADO |
| `mascota_custom_mascota` | `custom.mascota` | FK a `Mascota` | CONFIRMADO |
| `tipo_cita_custom_tipocita` | `custom.tipocita` | FK a `TipoCita` | CONFIRMADO |
| `orden_link_custom_ordenservicio` | `custom.ordenservicio` | FK opcional a `OrdenServicio` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.11 `TipoCita`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `nombre_text` | `text` | | CONFIRMADO |
| `duracion_min_number` | `number` | | CONFIRMADO |
| `color_text` | `text` | | CONFIRMADO |
| `is_disabled_boolean` | `boolean` | Soft-delete | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.12 `ItemCatalogo`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `nombre_text` | `text` | | CONFIRMADO |
| `descripcion_text` | `text` | | CONFIRMADO |
| `kind_text` | `text` | Diferencia servicio/producto | CONFIRMADO |
| `precio_inc_number` | `number` | “precio_inc” (significado exacto NO CONFIRMADO) | CONFIRMADO |
| `is_disabled_boolean` | `boolean` | Soft-delete | CONFIRMADO |
| `proveedor_custom_proveedor` | `custom.proveedor` | FK a `Proveedor` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.13 `Proveedor`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `nombre_text` | `text` | | CONFIRMADO |
| `contacto_text` | `text` | | CONFIRMADO |
| `telefono_text` | `text` | | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

**Nota de integridad:** auditorías posteriores reportan bug `clinica = null` en creación por UI (ver sección 7 y `migration_risks.md`).

### 2.14 `Almacen`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `nombre_text` | `text` | | CONFIRMADO |
| `is_default_boolean` | `boolean` | | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.15 `MovimientoStock`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `qty_number` | `number` | Puede ser positivo/negativo | CONFIRMADO |
| `motivo_text` | `text` | Texto libre | CONFIRMADO |
| `fecha_date` | `date` | | CONFIRMADO |
| `item_custom_itemcatalogo` | `custom.itemcatalogo` | FK a `ItemCatalogo` | CONFIRMADO |
| `almacen_custom_almacen` | `custom.almacen` | FK a `Almacen` | CONFIRMADO |
| `ref_venta_custom_venta` | `custom.venta` | FK opcional a `Venta` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.16 `Venta`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `estado_text` | `text` | Estado (texto) | CONFIRMADO |
| `total_number` | `number` | Total almacenado | CONFIRMADO |
| `created_at_date` | `date` | | CONFIRMADO |
| `created_by_user` | `user` | Usuario que crea | CONFIRMADO |
| `cliente_custom_cliente` | `custom.cliente` | FK a `Cliente` | CONFIRMADO |
| `orden_custom_ordenservicio` | `custom.ordenservicio` | FK opcional a `OrdenServicio` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

### 2.17 `ItemVenta`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `cant_number` | `number` | | CONFIRMADO |
| `precio_unit_number` | `number` | | CONFIRMADO |
| `total_linea_number` | `number` | | CONFIRMADO |
| `item_custom_itemcatalogo` | `custom.itemcatalogo` | FK a `ItemCatalogo` | CONFIRMADO |
| `venta_custom_venta` | `custom.venta` | FK a `Venta` | CONFIRMADO |

**Nota:** `ItemVenta` **no** tiene `clinica_custom_clinica` (el tenant se resuelve vía `Venta`).  
**Evidencia:** BLOQUE DATA MODEL.

### 2.18 `Ledger`

| Campo | Tipo Bubble | Notas | Estado |
|---|---|---|---|
| `tipo_text` | `text` | Tipo de movimiento | CONFIRMADO |
| `monto_number` | `number` | Monto del movimiento | CONFIRMADO |
| `fecha_date` | `date` | | CONFIRMADO |
| `cliente_custom_cliente` | `custom.cliente` | FK a `Cliente` | CONFIRMADO |
| `ref_venta_custom_venta` | `custom.venta` | FK opcional a `Venta` | CONFIRMADO |
| `orden_custom_ordenservicio` | `custom.ordenservicio` | FK opcional a `OrdenServicio` | CONFIRMADO |
| `clinica_custom_clinica` | `custom.clinica` | Tenant FK | CONFIRMADO |

**NO CONFIRMADO:** convención de signo (si negativos = cargos o viceversa) a nivel de datos históricos.

---

## 3) Relaciones y dependencias

### 3.1 Mapa de relaciones (resumen)

- `Clinica` ← `MembresiaClinica` → `User`
- `Clinica` ← `Cliente` → `Mascota`
- `Clinica` ← `OrdenServicio` → (`Cliente`, `Mascota`, `User` como `staff_user`)
- `OrdenServicio` → (`EntradaClinica`, `Adjunto`, `ItemCola`, `ItemVenta`, `Cita` vía `orden_link_custom_ordenservicio`)
- `Clinica` ← `Venta` → (`Cliente`, `OrdenServicio`, `ItemVenta`) y `ItemVenta` → `ItemCatalogo`
- `ItemCatalogo` → `Proveedor`
- `Clinica` ← `MovimientoStock` → (`ItemCatalogo`, `Almacen`, `Venta` opcional)
- `Clinica` ← `Ledger` → (`Cliente`, `Venta` opcional, `OrdenServicio` opcional)
- `Clinica` ← `Cita` → (`Cliente`, `Mascota`, `TipoCita`, `OrdenServicio` opcional)

**Evidencia:** BLOQUE DATA MODEL (mapa de dependencias).

---

## 4) Enums implícitos (texto libre) y valores observados

> Regla: **solo** se listan como “confirmados” los valores **observados** en workflows según la auditoría de enums.  
> Todo valor “inferido” se marca `NO CONFIRMADO`.

### 4.1 `OrdenServicio.estado_text`
- **Valores confirmados (observados en creación):** `"Open"`
- **Transiciones (ChangeThing) encontradas:** NO CONFIRMADO (la auditoría reporta que no se encontraron cambios de `estado_text` en el JSON analizado).
- **Canon sugerido para migración (no como hecho histórico):** `open`, `in_progress`, `closed`, `cancelled` (NO CONFIRMADO excepto `open`).

### 4.2 `ItemCatalogo.kind_text`
- **Valores confirmados:** `"producto"`, `"servicio"` (completamente confirmados; hardcodeados en workflows).

### 4.3 `Ledger.tipo_text`
- **Valores confirmados:** `"pago"`
- Otros tipos posibles (NO CONFIRMADO): `cargo`, `devolucion`, `ajuste`.

### 4.4 `Cita.estado_text`
- **Hallazgo:** el campo existe, pero el workflow de creación auditado no lo setea → **citas pueden crearse con `estado_text = null`** (BUG).
- Valores de estado (NO CONFIRMADO): `programada`, `confirmada`, `cancelada`, `completada`.

### 4.5 `Venta.estado_text`
- **Estado:** NO CONFIRMADO (no se observaron valores literales en el JSON analizado para escritura).
- “anulada” aparece en UI como acción (confirmación parcial del valor), pero el set completo de estados sigue NO CONFIRMADO.

### 4.6 `MovimientoStock.motivo_text`
- **Estado:** NO CONFIRMADO (no se observaron valores literales en el JSON analizado).
- Valores inferidos (NO CONFIRMADO): `venta`, `entrada`, `ajuste`, `devolucion`.

### 4.7 `ItemCola.carril_text`
- **Estado:** NO CONFIRMADO (sin valores literales observados en el JSON analizado).

### 4.8 `MembresiaClinica.rol_text`
- **Estado:** NO CONFIRMADO (sin valores literales observados en el JSON analizado).
- Valores inferidos (NO CONFIRMADO): `admin`, `veterinario`, `recepcionista`.

### 4.9 `EntradaClinica.tipo_text`
- **Estado:** texto totalmente libre (se escribe desde input dinámico).
- Valores sugeridos (NO CONFIRMADO): `nota`, `diagnostico`, `tratamiento`, `receta`.

**Evidencia:** “AUDITORÍA DE ENUMS GUARDADOS COMO TEXT LIBRE” → “TABLA MAESTRA DE ENUMS”.

---

## 5) Privacy rules (Bubble)

### 5.1 `User` (confirmado)
- Rol `everyone`: `view_all=false`, `search_for=false`, `view_fields=["Modified Date","Created Date"]`, `auto_binding=false`, `view_attachments=false`.
- Rol `User's own data` (condición: CurrentUser = this User): `view_all=true`, `search_for=true`, `auto_binding=false`, `view_attachments=true`.

### 5.2 Tipos custom (estado más reciente)
- **Privacy Rules fuera de `User`: AUSENTES — CONFIRMADO** (según auditorías posteriores).

**Evidencia:** Sección de privacy + cierres de auditoría (“Privacy Rules: AUSENTES — CONFIRMADO”).

---

## 6) Seed mínima para reconstrucción

Orden de inserción sugerido por dependencias:
1. `Clinica` (demo)
2. `User` (via auth)
3. `MembresiaClinica` (sin esto el usuario no “pasa” el flujo de selección)
4. `Almacen` (default)
5. `Proveedor` (al menos 1)
6. `ItemCatalogo` (servicios/productos base)
7. `TipoCita` (al menos 1)
8. `Cliente` + `Mascota` (datos de prueba)

Además: setear `CurrentUser.clinica_activa_custom_clinica = [Clinica]` post-login.

**Evidencia:** sección “SEED MÍNIMA PARA RECONSTRUCCIÓN”.

---

## 7) Notas de integridad y observaciones

- Multi-tenancy es frágil si existen registros con `clinica_custom_clinica = null` (reportado como bug en auditorías posteriores para al menos algunas entidades).
- `Venta.total_number` es un valor **almacenado** (riesgo de inconsistencias si se crean/modifican `ItemVenta` sin recalcular).
- `ItemVenta` no posee `clinica_custom_clinica` (filtrado por tenant debe resolverse vía `Venta`).
- `Adjunto` no registra autor (ausencia reportada).
- `MovimientoStock` no registra usuario que realizó el movimiento (ausencia reportada).

**Evidencia:** BLOQUE DATA MODEL + secciones de riesgos/bugs posteriores.

