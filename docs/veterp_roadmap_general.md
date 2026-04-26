# VetERP — Roadmap General de Producto y Desarrollo

## 1. Propósito del documento

Este documento sirve como guía maestra para el desarrollo de VetERP.  
Su objetivo es alinear a cualquier herramienta, desarrollador o asistente que trabaje sobre el proyecto, dejando claro:

- qué es VetERP
- qué problema resuelve
- qué módulos existen
- qué módulos faltan
- cuál es el estado aproximado de cada área
- cuál es el orden recomendado de implementación
- qué ideas estratégicas deben conservarse para futuras iteraciones

---

## 2. Qué es VetERP

VetERP es un ERP veterinario orientado a clínicas y hospitales veterinarios.

Su propósito es centralizar en un solo sistema la operación diaria de una clínica, incluyendo:

- acceso multiusuario y multiclinica
- gestión de clientes y mascotas
- agenda y citas
- atenciones / órdenes de servicio
- historia clínica
- caja, cobros y ventas
- inventario y stock
- configuración operativa de la clínica
- flujos de migración y digitalización de historial antiguo

No debe entenderse solo como un “software administrativo”, sino como una plataforma operativa para apoyar el trabajo clínico, administrativo y comercial de una veterinaria.

---

## 3. Visión del producto

### Visión base
Construir un sistema veterinario usable, moderno y operativo, que permita a una clínica trabajar su día a día desde un solo lugar.

### Visión extendida
Convertir VetERP en una plataforma con valor diferencial real frente a software más básico, incorporando con el tiempo:

- mejor historia clínica longitudinal
- flujos de caja y cobro más completos
- digitalización de historial previo
- automatización de procesos operativos
- herramientas de soporte para crecimiento de la clínica

---

## 4. Principios del proyecto

1. **Primero estabilidad, luego polish**
   - La prioridad es que funcione de verdad.
   - Luego se mejora UX/UI.

2. **Producto B2B, no autoservicio libre**
   - El acceso ideal no es signup abierto sin control.
   - El sistema debe permitir acceso administrado por clínica.

3. **No depender de hacks manuales**
   - La app debe quedar usable sin SQL raro para pruebas básicas.
   - Demo data, onboarding y rutas deben ser explícitos y repetibles.

4. **Paridad operativa antes que fantasía técnica**
   - Primero cubrir bien los módulos operativos reales.
   - Luego agregar extras.

5. **Una sola fuente de verdad**
   - El roadmap debe guiar a cualquier herramienta futura.
   - No se debe improvisar sin revisar este documento.

---

## 5. Estado actual del proyecto

## Lectura honesta del estado
VetERP ya tiene gran parte del motor técnico reconstruido, pero todavía no debe considerarse “producto final”.

### Lo que ya existe en algún grado
- autenticación
- selección de clínica
- shell operativa
- clientes y mascotas
- agenda y tipos de cita
- atenciones / órdenes
- caja y ventas
- inventario y movimientos de stock
- ajustes base
- RBAC base
- seed/demo parcial
- protección de rutas y contexto tenant

### Lo que todavía falta cerrar
- estabilidad total de sesión y cambio de clínica
- demo data confiable y suficiente
- mejor densidad de información en pantallas clave
- paridad real con algunos flujos de Bubble
- historia clínica longitudinal como módulo fuerte
- settings más completos
- flujos administrativos más robustos
- polish general de UX/UI

---

## 6. Estado estimado por áreas

> Estos porcentajes son orientativos.  
> No significan “listo para producción”, sino una estimación del avance relativo de cada módulo.

| Área | Estado estimado | Comentario |
|---|---:|---|
| Auth / sesión / acceso | 70% | Funciona en gran parte, pero todavía requiere estabilización fina |
| Multi-clínica / contexto tenant | 70% | Base construida, pero cambio de clínica y estados ambiguos deben pulirse |
| Shell / navegación / rutas | 75% | Mucho mejor que al inicio, pero aún con inconsistencias a resolver |
| Clientes y Mascotas | 65% | Base funcional, pero aún poco “producto” y poca densidad |
| Agenda y Citas | 60% | Estructura existe, pero todavía necesita mejor flujo y mejor demo data |
| Atenciones / Órdenes | 65% | Bastante avanzadas, pero pueden enriquecerse mucho más |
| Colas | 35% | Hay una versión básica, pero aún no es la paridad real deseada |
| Caja / Ventas | 60% | Núcleo hecho, pero aún falta UX y reglas más completas |
| Inventario / Kardex | 65% | Base sólida, aún con mejoras pendientes en uso real |
| Ajustes / Configuración | 45% | Existe, pero sigue incompleto como panel real de administración |
| Seed / datos demo | 40% | Todavía necesita consolidación y repetibilidad clara |
| UX/UI general | 35% | Muy por detrás del backend; sigue sintiéndose scaffold |
| Historia clínica longitudinal | 20% | Idea clara, implementación todavía temprana o incompleta |
| Digitalización OCR / historial antiguo | 5% | Idea estratégica, aún no implementada |

---

## 7. Módulos del producto

## 7.1 Núcleo operativo

### A. Acceso y sesión
Incluye:
- login
- logout
- cambio de clínica
- selección de clínica
- protección de rutas
- RBAC base

### B. Clientes y mascotas
Incluye:
- listado de clientes
- listado y vínculo de mascotas
- creación de cliente
- creación de mascota
- detalle de cliente
- futuras fichas más completas

### C. Agenda y citas
Incluye:
- tipos de cita
- crear cita
- ver agenda
- gestión básica del calendario
- relación cita ↔ cliente ↔ mascota

### D. Atenciones / Órdenes de servicio
Incluye:
- creación de atención
- seguimiento de orden
- resumen de orden
- entradas clínicas
- adjuntos
- futura evolución clínica más fuerte

### E. Colas
Incluye:
- sala de espera / atención activa
- futuro modelo real con ItemCola
- futura separación por carriles
- posible grooming / médica / laboratorio

### F. Caja y ventas
Incluye:
- ventas
- ítems de venta
- estados de pago
- cuentas por cobrar
- ledger / movimientos de cobro
- futura ampliación de caja

### G. Inventario
Incluye:
- catálogo
- stock
- almacenes
- proveedores
- kardex / movimientos
- rebaja por venta
- ajustes manuales

### H. Ajustes
Incluye:
- configuración general
- catálogo
- proveedores
- almacenes
- futura administración de clínica y usuarios

---

## 7.2 Módulos estratégicos futuros

### I. Historia clínica longitudinal
Objetivo:
separar la visita/orden del expediente histórico permanente de la mascota.

Debe incluir:
- ficha médica longitudinal
- peso, temperatura, signos vitales
- motivo de consulta
- anamnesis
- diagnóstico
- plan terapéutico
- evolución
- historial por mascota, no solo por orden

### J. Digitalización de historial antiguo
Objetivo:
permitir migrar documentos y PDF escaneados a historial clínico usable.

Ver idea detallada en el apartado 13.

### K. Configuración avanzada y administración
Objetivo:
dar a owner/admin herramientas reales para operar la clínica sin SQL.

Debe incluir:
- datos de clínica
- branding básico
- usuarios e invitaciones
- permisos por rol
- configuración operativa
- parámetros de catálogo y agenda

### L. Reportes y analítica
Objetivo:
dar visibilidad operativa y financiera.

Posibles reportes:
- ventas por rango
- citas por periodo
- ingresos por médico
- productos más vendidos
- stock bajo
- clientes activos/inactivos
- deuda pendiente

---

## 8. Roadmap general por etapas

## Etapa 0 — Estabilización base
Objetivo:
que la app deje de romperse en flujos esenciales.

Incluye:
- login confiable
- logout confiable
- cambio de clínica
- select clínica
- sidebar coherente
- rutas canónicas
- build limpio
- shell sin errores críticos

**Estado:** avanzado, pero todavía necesita validación continua.

---

## Etapa 1 — Beta interna usable
Objetivo:
que el sistema pueda probarse de verdad dentro de un entorno controlado.

Incluye:
- seed demo usable y repetible
- dashboard real
- clientes más producto
- agenda probables
- atenciones con flujo claro
- caja/inventario mínimamente útiles
- ajustes visibles y navegables
- empty states honestos
- menos dependencia de SQL manual

**Meta:** primera beta interna utilizable.

---

## Etapa 2 — Paridad operativa fuerte
Objetivo:
acercarse de verdad a la promesa del Bubble original, pero con mejor base técnica.

Incluye:
- colas más reales
- mejor agenda
- mejor detalle de orden
- mejor ficha cliente
- mejor ficha mascota
- coherencia total entre módulos
- densidad de información clínica y administrativa

**Meta:** producto usable de verdad para operaciones reales controladas.

---

## Etapa 3 — Valor médico real
Objetivo:
dejar de ser solo un admin ERP y convertirse en sistema clínico serio.

Incluye:
- historia clínica longitudinal
- expediente por mascota
- mejores formularios clínicos
- mejores entradas médicas
- evolución histórica
- diagnósticos y tratamientos más estructurados

**Meta:** valor clínico real, no solo administrativo.

---

## Etapa 4 — Administración avanzada
Objetivo:
dar autonomía completa a la clínica.

Incluye:
- settings completos
- usuarios y permisos
- invitaciones
- más configuración por clínica
- más control administrativo
- más métricas y reportes

---

## Etapa 5 — Diferenciadores
Objetivo:
crear ventajas competitivas frente a otros sistemas.

Incluye:
- digitalización OCR de historias previas
- migración asistida
- automatizaciones
- reportes avanzados
- mejores integraciones
- posibles módulos premium

---

## 9. Próximos sprints recomendados

## Sprint recomendado inmediato
### Sprint A — Logout real + demo data verificable
Objetivo:
resolver dos bloqueos operativos muy concretos:
- cerrar sesión y cambiar clínica funcionando de verdad
- demo data explícita, repetible y suficiente

### Resultado esperado
- se puede entrar, salir y cambiar clínica
- la app ya no se ve vacía
- se puede probar agenda, clientes, caja e inventario

---

## Sprint siguiente
### Sprint B — Dashboard real + clientes más producto
Objetivo:
que Inicio y Clientes se sientan útiles.

Incluye:
- métricas reales
- resúmenes
- tarjetas operativas
- más densidad en clientes
- mejor detalle de cliente
- mejor acción de crear cliente

---

## Sprint siguiente
### Sprint C — Agenda + colas más sólidas
Objetivo:
que las citas y la sala de espera se sientan más reales.

Incluye:
- mejor data demo
- mejor separación entre agenda y colas
- colas menos “placeholder”
- posible transición hacia ItemCola real

---

## Sprint siguiente
### Sprint D — Orden y clínica más rica
Objetivo:
mejorar la calidad del trabajo médico dentro de la orden.

Incluye:
- mejor resumen de orden
- mejores entradas
- mejor flujo clínico
- más datos operativos en una atención

---

## Sprint siguiente
### Sprint E — Historia clínica longitudinal
Objetivo:
crear la primera gran capa médica de verdad.

---

## 10. Backlog priorizado

## Prioridad alta
- logout estable
- cambiar clínica estable
- demo data repetible
- clientes suficientes para probar agenda
- seed con órdenes, citas y ventas
- agenda sin errores
- shell sin incoherencias
- dashboard real
- clientes más densos
- detalle de cliente útil

## Prioridad media
- colas reales
- mejor orden y colas
- mejores filtros
- mejores tablas
- ajustes más completos
- caja más rica
- métricas más completas
- control más fino por rol

## Prioridad baja / posterior
- OCR
- migración documental avanzada
- reportes premium
- automatizaciones complejas
- features experimentales

---

## 11. Qué NO hacer

- no abrir ramas nuevas sin necesidad
- no reescribir todo el proyecto
- no ocultar errores sin arreglar causa raíz
- no depender de hacks de seed ocultos
- no mezclar demasiados objetivos en un solo sprint
- no desarrollar módulos enormes sin antes cerrar la estabilidad básica
- no asumir que “backend hecho = producto listo”

---

## 12. Criterios de calidad para cualquier cambio futuro

Todo sprint futuro debería dejar:

1. **causa raíz identificada**
2. **archivos modificados claros**
3. **build en verde**
4. **typecheck en verde**
5. **sin ramas nuevas**
6. **sin basura local en commit**
7. **flujo funcional probado**
8. **entrega clara de lo pendiente**

---

## 13. Idea estratégica: digitalización de historias médicas veterinarias

### Resumen
Se propone incorporar al sistema una funcionalidad de digitalización de historias médicas antiguas o externas, con el objetivo de convertir documentación clínica no estructurada en registros digitales reutilizables dentro de VetERP.

### Problema
Muchas clínicas veterinarias tienen historias médicas en alguno de estos formatos:
1. Escritas a mano sobre papel.
2. Escritas en computadora, impresas y luego escaneadas.
3. Guardadas en PDF como imagen, sin texto seleccionable.
4. Mezclas de texto, tablas, observaciones clínicas y resultados de laboratorio no estructurados.

Esto dificulta enormemente la migración a un sistema digital, ya que obliga a cargar la información manualmente, con alto costo de tiempo y riesgo de error.

### Propuesta
Crear un módulo de digitalización documental que permita subir archivos PDF escaneados y transformarlos en información digital estructurada o semiestructurada, lista para revisión y posterior incorporación al sistema.

### Flujo propuesto
1. Carga de documentos PDF.
2. Preprocesamiento del archivo.
3. OCR.
4. Limpieza y normalización.
5. Reconstrucción del contenido.
6. Revisión humana.
7. Vinculación con cliente / mascota / historial clínico.

### Alcance realista
Más viable para:
- PDFs escaneados de documentos impresos por computadora
- informes clínicos y laboratorios

Más complejo para:
- manuscritos
- letra médica difícil
- escaneos de mala calidad

### Modelo de monetización posible
- servicio adicional por documento
- paquete de migración inicial
- funcionalidad premium
- cobro por volumen de páginas

### Recomendación
No implementarlo todavía.  
Primero cerrar la beta operativa del producto base.

---

## 14. Conclusión

VetERP ya tiene una base técnica importante, pero todavía no debe tratarse como producto terminado.

La prioridad actual no es “agregar cualquier feature nueva”, sino:

1. estabilizar
2. poblar demo data útil
3. convertir las pantallas base en producto usable
4. consolidar agenda, clientes, atenciones y caja
5. luego avanzar a historia clínica, configuración avanzada y OCR

Este roadmap debe usarse como guía central para cualquier nueva iteración del proyecto.
