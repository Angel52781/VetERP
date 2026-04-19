# VetERP — migration_risks.md (riesgos, contradicciones y huecos)

## Índice
1. Resumen ejecutivo de riesgos
2. Tabla consolidada de riesgos (R-01…)
3. Bugs críticos priorizados (P0–P3)
4. Contradicciones detectadas (y “versión ganadora”)
5. Huecos de información (preguntas abiertas)
6. Decisiones que NO deben asumirse
7. Partes frágiles del proyecto Bubble (acoplamientos)
8. Riesgos multi-tenant
9. Riesgos de seguridad
10. Riesgos de migración de datos (export, IDs, adjuntos, auth)

---

## 1) Resumen ejecutivo de riesgos

### Riesgos “bloqueantes” (si no se resuelven, la migración es insegura o los datos quedan corruptos)
- **Multi-tenant sin enforcement server-side** (aislamiento dependiente de filtros/UI y clínica activa).
- **Datos con `clinica = null`** en múltiples data types por workflows de creación inconsistentes.
- **FKs nulas o erróneas** en datos críticos (p.ej., `Mascota.dueno`, `ItemVenta.venta`, `EntradaClinica.orden`).

**Evidencia:** “SECCIÓN 7: RIESGOS Y ACOPLAMIENTOS PARA MIGRACIÓN” + “TABLA DE BUGS CRÍTICOS — ORDEN DE PRIORIDAD PARA MIGRACIÓN”.

---

## 2) Tabla consolidada de riesgos (R-01…)

| ID | Severidad | Tipo | Descripción (normalizada) | Evidencia |
|---|---|---|---|---|
| R-01 | CRÍTICA | Multi-tenancy | `clinica_activa` + filtros UI como único aislamiento; ausencia de privacy rules en la mayoría de tipos; riesgo de acceso cruzado si cambia clínica activa | Sección 7.1 |
| R-02 | CRÍTICA | Datos corruptos | `clinica = null` en `OrdenServicio` (y otros) por workflows que no asignan clínica | Sección 7.1 + tabla de asignación clinica |
| R-03 | ALTA | Integridad financiera | `Ledger` sin clínica asignada (reportado) y `tipo_text` solo confirmado como `"pago"`; SUM mezcla todo | Sección 7.1 + auditoría de enums |
| R-04 | ALTA | Colas / Kanban | `ItemCola` sin estado propio; tablero usa `.first` (no kanban real) | Sección 7.1 |
| R-05 | ALTA | Timestamps | `started_at_date` y `finished_at_date` “muertos” (no set automático confirmado) | Sección 7.1 |
| R-06 | ALTA | Enums como texto | `estado_text`, `kind_text`, `rol_text`, etc. sin OptionSet; typos rompen lógica | Sección 7.1 + TABLA MAESTRA DE ENUMS |
| R-07 | MEDIA | Duplicación lógica | rutas duplicadas para ajustes de stock (posible divergencia) | Sección 7.1 |
| R-08 | MEDIA | FK/tenant inconsistente | riesgo de `clinica` nula en `ItemCatalogo` y `Proveedor` (no asignada en workflows confirmados) | Sección 7.1 + bugs P0 |
| R-09 | MEDIA | Concurrencia | `ItemCola.indice_number` sin transacción atómica; índices duplicados | Sección 7.1 |
| R-10 | MEDIA | “Dead code” UI | alerta “stock bajo” / botón sin acción confirmada | Sección 7.1 |
| R-11 | MEDIA | Patrones divergentes | mezcla de `CurrentUser.clinica_activa` vs `Search(Membresia).first.clinica` en filtros | Sección 7.1 |
| R-12 | BAJA | Onboarding | Signup no crea `MembresiaClinica`; usuario nuevo queda bloqueado | Sección 7.1 + sección de acceso/sesión |
| R-13 | BAJA | Venta/orden | si una orden no tiene venta vinculada, UI muestra “saldo pendiente” incorrecto (0 pagado) | Sección 7.1 |
| R-14 | BAJA | Acoplamiento Bubble | Bubble IDs como PK implícita, Bubble Storage para adjuntos, auth Bubble, límites de search (5000) | Sección 7.1 + acoplamientos |

---

## 3) Bugs críticos priorizados (P0–P3)

> Estos bugs describen **calidad de datos** y “puntos de corrupción” al escribir desde UI/workflows, con impacto directo en export/migración.

| Prioridad | Bug | Impacto | Evidencia |
|---|---|---|---|
| P0 | `clinica = null` en múltiples data types | Multi-tenant inviable / filtros fallan | TABLA DE BUGS CRÍTICOS |
| P0 | `Mascota.dueno = null` | relación dueño–mascota rota | TABLA DE BUGS CRÍTICOS |
| P0 | `ItemVenta.venta = null` | líneas de venta huérfanas (sin venta) | TABLA DE BUGS CRÍTICOS |
| P0 | `EntradaClinica.orden = Search(...).first` sin constraints | notas clínicas vinculadas a orden equivocada | TABLA DE BUGS CRÍTICOS |
| P1 | `Venta.total = 0` siempre / no persistido | totales financieros incorrectos | TABLA DE BUGS CRÍTICOS |
| P1 | `ItemVenta.precio_unit` / `total_linea` = null | se pierde historial de precios | TABLA DE BUGS CRÍTICOS |
| P1 | `Adjunto.orden = null` | adjuntos sin FK a atención | TABLA DE BUGS CRÍTICOS |
| P2 | `OrdenServicio.clinica` asignada como `Search(Membresia).first` | no determinista si hay múltiples membresías | TABLA DE BUGS CRÍTICOS |
| P2 | `Ledger.monto` con auto-binding sin mapeo explícito | pagos pueden quedar en null | TABLA DE BUGS CRÍTICOS |
| P2 | `EntradaClinica.autor = null` (variante) | pérdida de trazabilidad | TABLA DE BUGS CRÍTICOS |
| P3 | Sin workflow de creación UI para `MembresiaClinica` | alta de usuarios manual | TABLA DE BUGS CRÍTICOS |
| P3 | `Cita.end_date = null` y `Cita.clinica = null` | citas sin duración y sin tenant | TABLA DE BUGS CRÍTICOS |

---

## 4) Contradicciones detectadas (y “versión ganadora”)

> Regla: se toma como verdad el **estado más reciente** en el archivo, y la contradicción se registra aquí.

### 4.1 Guards de acceso (páginas operativas)
- **Versión antigua (contradictoria):** “no se detectan workflows Page is Loaded que redirijan”.
- **Versión más reciente (ganadora):** sí existen guards en páginas operativas con 3 checks (logged out, sin membresía, sin clínica activa) que redirigen a `select_clinica`.
- Impacto: cualquier reconstrucción debe incorporar el guard explícito (server-side) desde el inicio.

**Evidencia:** “SISTEMA DE NAVEGACIÓN, ACCESO Y SESIÓN” (guards) vs sección 2 de acceso en auditoría maestra.

### 4.2 Privacy rules fuera de `User`
- **Versión temprana:** “NO AUDITADO / NO CONFIRMADO”.
- **Versión más reciente (ganadora):** “Privacy Rules: AUSENTES — CONFIRMADO”.

**Evidencia:** cierres de auditoría (p.ej. proveedor) + sección de privacy.

### 4.3 Estados de `OrdenServicio.estado_text`
- En una sección se muestran estados en español (“Abierta/En Progreso/Finalizada/Cancelada”) y en otra se indica que en DB el valor escrito confirmado en creación es `"Open"`.
- **Versión ganadora para “valor escrito”:** `"Open"` es el único valor confirmado por auditoría de enums (workflows).
- **Lo demás:** NO CONFIRMADO hasta ver App Data real.

**Evidencia:** “TABLA MAESTRA DE ENUMS” + descripción de UI en `orden_y_colas`.

### 4.4 Otras contradicciones recurrentes
- `Option Sets`: reportados como inexistentes (maestra) vs “no detectados” en bloques tempranos.
- Asignación de clínica: conviven patrones `Search(Membresia).first` y `Empty/null` (estado actual = inconsistente).

---

## 5) Huecos de información (preguntas abiertas)

1. **Valores reales históricos** en App Data (no solo lo que los workflows escriben):
   - `OrdenServicio.estado_text` (set completo + typos)
   - `Venta.estado_text`
   - `MovimientoStock.motivo_text`
   - `ItemCola.carril_text`
   - `MembresiaClinica.rol_text` y `permisos_list_text`
2. **Conteos reales** y volumen por tabla (para estimar truncamientos y performance de export).
3. **Exportabilidad completa**:
   - ¿Cómo se exportarán más de 5000 registros por search (Bubble limit) si existen?
4. **Adjuntos**:
   - Inventario completo de URLs/archivos, tamaño total, permisos reales de acceso.
5. **Workflows no recuperados**:
   - JSON faltante de algunos workflows críticos (p.ej. creación de `ItemCatalogo` reportada como “pendiente recuperar JSON”).

---

## 6) Decisiones que NO deben asumirse

- Convención de signo para `Ledger.monto_number` (si aplica, o si todo es positivo).
- Set completo y semántica de estados:
  - `OrdenServicio.estado_text` (más allá de `"Open"`)
  - `Cita.estado_text` (y si debe existir siempre)
  - `Venta.estado_text`
- Cómo se determina el “tenant correcto” cuando el usuario tiene múltiples `MembresiaClinica` (no asumir `.first`).
- Que `Venta.total_number` sea confiable (hay bug reportado de total=0/no recalculado).
- Que todos los registros tengan `clinica_custom_clinica` poblado (hay bug P0).
- Que el signup capture rol de forma segura: el campo “Rol” en signup se considera **riesgo**, no una verdad de IAM.

---

## 7) Partes frágiles del proyecto Bubble (acoplamientos)

- **Duplicación de UI/workflows** entre páginas (sin reusable elements) → divergencias y bugs.
- **Dependencia de Bubble IDs** como PK implícita (no hay UUID propio en campos).
- **Almacenamiento de archivos** en Bubble Storage (`Adjunto.archivo_file`).
- **Límites de búsqueda** (Bubble “search cap” típico de 5000) con riesgo de export truncado.
- **Patrón `.first` en búsquedas** (no determinista, especialmente con múltiples membresías/órdenes).

**Evidencia:** acoplamientos en sección 7.3 + bugs y notas de UI.

---

## 8) Riesgos multi-tenant

- Ausencia de enforcement server-side fuera de `User` (privacy rules ausentes).
- `clinica = null` en creación de múltiples entidades → datos “fantasma” que no aparecen con filtros.
- Dependencia de `User.clinica_activa` (mutable por el usuario) como pivote de aislamiento.

**Evidencia:** R-01/R-02 + P0 clinica null.

---

## 9) Riesgos de seguridad

- Signup incluye un campo “Rol” (texto libre) en al menos una página: riesgo de escalamiento si el rol se usa aguas abajo.
- Si no hay privacy rules server-side, un usuario autenticado podría leer datos cruzados si logra queries sin filtro o si manipula clínica activa.
- Adjuntos/URLs: riesgo de acceso directo si se exponen enlaces de Bubble Storage fuera del contexto de la app.

**Evidencia:** descripción `index` (signup) + sección de privacy + riesgos.

---

## 10) Riesgos de migración de datos (export, IDs, adjuntos, auth)

- **Usuarios/credenciales:** Bubble no expone hashes de password → migración requiere reset/invitación (no asumir portabilidad de contraseñas).
- **IDs:** mantener `bubble_id` como referencia durante transición (no asumir que el ID de Bubble puede ser el PK final).
- **Adjuntos:** descargar y re-hostear antes de decomisionar Bubble.
- **Truncamientos:** validar export masivo (no depender de búsquedas limitadas).
- **Integridad FK:** antes de migrar, auditar y corregir registros con FKs null (`clinica`, `Mascota.dueno`, `ItemVenta.venta`, `Adjunto.orden`, etc.).

**Evidencia:** sección 7.3 (acoplamientos) + tabla de bugs críticos + notas de auditoría de app data.

