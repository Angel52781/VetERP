# VetERP - Roadmap General de Producto

Fecha de actualizacion: 2026-05-06
Estado: beta controlada / pre-AWS operativa

## 1. Proposito del documento

Este documento es la guia maestra de producto para VetERP. Su objetivo es dejar claras las decisiones recientes, el estado actual y el orden recomendado de desarrollo sin convertir cada idea en una feature inmediata.

VetERP es un ERP/EMR veterinario construido con Next.js App Router, TypeScript y Supabase. El producto busca centralizar la operacion diaria de una clinica veterinaria: clientes, pacientes, agenda, recepcion, atenciones, caja, inventario, grooming, hospitalizaciones, staff y configuracion.

## 2. Estado actual

La beta ya tiene una base funcional amplia:

- Deploy en AWS EC2 funcionando.
- Auth, seleccion de clinica y staff basico.
- Clientes y pacientes.
- Agenda por areas.
- Tipos de cita, incluyendo consulta, banos, grooming, movilidad y cirugias programadas.
- Servicios de grooming, banos, movilidad y promociones editables.
- Atencion clinica / orden de servicio.
- Caja y cobro basico.
- Estado de cuenta basico.
- Seguimientos basicos.
- Inventario MVP con movimientos e historial de stock.
- Catalogo de productos y servicios.

La lectura actual es clara: VetERP ya no esta en fase de demo tecnica. Esta en una beta controlada que necesita reorganizacion operativa y cierre de flujos antes de agregar features grandes.

## 3. Principios vigentes

1. Agenda es para lo programado.
2. Recepcion es para el ingreso real del dia.
3. Paciente debe ser la historia longitudinal del animal, no solo una ficha basica.
4. Grooming debe separarse visual y operativamente de consulta clinica.
5. Hospitalizaciones debe ser modulo propio.
6. Cirugias se programan en Agenda por ahora; no van en navegacion principal todavia.
7. Recordatorios deben ser generales, no solo clinicos.
8. Inventario conectado a servicios es posterior al cierre operativo base.
9. No se deben abrir modulos gigantes si el flujo diario aun puede simplificarse.
10. Prioridad: beta usable en clinica real controlada antes que sofisticacion.

## 4. Navegacion objetivo

La navegacion objetivo del producto es:

- Inicio
- Recepcion
- Agenda
- Grooming
- Hospitalizaciones
- Caja
- Inventario
- Clientes
- Pacientes
- Ajustes

Atenciones y Colas se ocultaran eventualmente del nav principal. No deben borrarse rutas todavia porque siguen soportando flujos existentes y pueden servir como base interna para Recepcion y Ordenes.

## 5. Decisiones tomadas

### Agenda

Agenda queda como hub de eventos programados:

- consultas agendadas
- grooming y banos programados
- movilidad programada
- cirugias programadas
- otros eventos programados

Agenda no debe cargar con el flujo de ingreso espontaneo del dia. Ese rol pasa a Recepcion.

### Recepcion

Recepcion sera el punto de entrada operativo del dia:

- buscar cliente y paciente
- crear cliente o paciente si no existe
- registrar motivo libre
- marcar destino: clinica, grooming o emergencia
- abrir atencion clinica cuando corresponda
- reemplazar visualmente Atenciones y Colas en la navegacion principal

La implementacion debe ser incremental. Primero se crea la experiencia visible de Recepcion; luego se decide que rutas internas siguen vivas, se renombran o se encapsulan.

### Grooming

Grooming sera modulo propio. Debe cubrir:

- banos
- grooming
- cortes
- deslanado
- desmotado
- servicios y combos configurables
- observaciones importantes del paciente
- notas relevantes para manejo del animal

El uso de productos desde inventario queda para una fase posterior. No debe bloquear el primer modulo real de Grooming.

### Hospitalizaciones

Hospitalizaciones sera modulo propio, no una subpantalla escondida dentro de atenciones.

Debe incluir:

- diagnostico presuntivo
- temperatura
- frecuencia respiratoria
- frecuencia cardiaca
- peso
- fecha y hora de internamiento
- tiempo estimado
- medico tratante
- suero
- farmacos, dosis y frecuencia
- comida
- orina
- heces
- observaciones
- TLC
- mucosas
- deshidratacion
- alta

### Cirugias

Cirugias no va en la navegacion principal por ahora.

En la fase actual se maneja como programacion dentro de Agenda. Mas adelante tendra logica propia:

- tipo de cirugia
- medico
- asistentes
- precio
- examenes prequirurgicos
- riesgo
- materiales
- anestesia
- inventario consumido

### Paciente 360

Pacientes debe evolucionar hacia una historia longitudinal completa:

- resumen del paciente
- responsables
- observaciones y notas importantes
- alertas y alergias
- historial clinico
- historial grooming
- historial hospitalizaciones
- laboratorios
- datos de control
- procedimientos
- diagnosticos
- prescripciones
- archivos adjuntos
- vacunas
- recordatorios
- actividad

### Notas importantes del paciente

Las notas importantes del paciente pasan a ser una capacidad transversal. Ejemplos:

- muerde
- convulsiona
- se estresa
- alergias
- no usar cierto medicamento
- solo se deja cortar unas con el responsable

Deben ser editables y visibles o accesibles desde:

- Paciente
- Recepcion
- Atencion clinica
- Grooming
- Hospitalizaciones

### Recordatorios generales

Recordatorios deja de ser solo clinico. Debe soportar:

- llamar responsable
- aplicar dosis
- muestra pendiente
- control
- vacuna
- revision

Filtros necesarios:

- vencidos
- proximos 7 dias
- proximos 30 dias

Al hacer clic en un filtro, el usuario debe ver la lista correspondiente.

### Inicio

Inicio debe subir de utilidad operativa:

- acciones rapidas mas arriba
- grooming y banos de hoy
- cirugias proximas
- recordatorios vencidos y proximos
- stock bajo
- caja si el rol tiene permiso

## 6. Mapa de modulos actual

| Modulo | Estado | Observacion |
|---|---|---|
| Auth / Clinica | Beta usable | Deploy y flujo base funcionando. |
| Staff | Beta usable | Roles basicos e invitaciones; falta profundidad de permisos. |
| Inicio | Usable, incompleto | Necesita convertirse en panel operativo real. |
| Recepcion | Falta como modulo visible | Atenciones/Colas existen, pero no como experiencia de recepcion. |
| Agenda | Beta usable | Ya soporta areas; debe consolidarse como programacion. |
| Clientes | Beta usable | Flujo base funcionando. |
| Pacientes | Usable, incompleto | Debe evolucionar a Paciente 360. |
| Atencion / Orden | Beta usable | Base clinica y comercial ya existe. |
| Grooming | Parcial | Hay tipos/servicios; falta modulo operativo propio. |
| Hospitalizaciones | Falta | Debe ser modulo separado. |
| Cirugias | Parcial por Agenda | Programable, sin flujo quirurgico propio. |
| Caja / Cobro | Beta usable | Cobro basico y estado de cuenta inicial. |
| Inventario | Beta usable MVP | Movimientos e historial; falta conexion con servicios y consumo. |
| Catalogo | Beta usable | Productos/servicios editables. |
| Seguimientos | Basico | Debe evolucionar a recordatorios generales. |
| Ajustes | Usable | Configuracion base; faltan maestros mas completos. |

## 7. Roadmap por fases

## Fase 0 - Beta base cerrada

### Objetivo

Conservar y estabilizar lo ya funcional sin abrir modulos grandes.

### Entra

- Validar deploy EC2.
- Mantener flujos actuales de clientes, pacientes, agenda, orden, caja e inventario.
- Cerrar bugs P0/P1 de beta.
- Mantener agenda por areas.
- Confirmar que grooming/banos/movilidad/cirugias programadas aparecen correctamente.
- Mantener servicios editables.
- Mantener inventario MVP.

### No entra

- Redisenar navegacion completa.
- Crear hospitalizaciones.
- Crear modulo quirurgico completo.
- Conectar inventario a cada servicio.

### Valor

Permite seguir usando la beta sin desordenar la base que ya funciona.

## Fase 1 - Reorganizacion operativa

### Objetivo

Separar lo programado de lo que entra hoy por recepcion.

### Entra

- Crear modulo visible de Recepcion.
- Flujo: buscar o crear cliente/paciente.
- Registrar motivo libre.
- Marcar destino: clinica, grooming o emergencia.
- Abrir atencion clinica desde recepcion.
- Ajustar navegacion objetivo.
- Ocultar progresivamente Atenciones y Colas del nav principal sin borrar rutas.
- Mejorar Inicio con acciones rapidas mas visibles.

### No entra

- Motor complejo de triage.
- Reglas avanzadas de sala de espera.
- Redisenar toda Orden de Servicio.

### Dependencias

- Clientes.
- Pacientes.
- Ordenes existentes.
- Agenda actual.

### Riesgo

Duplicar flujos si Recepcion no se define como la entrada operativa principal.

### Valor

Muy alto. Ordena el uso diario y hace que el sistema se entienda mejor en clinica real.

## Fase 2 - Paciente 360

### Objetivo

Convertir Pacientes en la historia longitudinal central del animal.

### Entra

- Resumen clinico del paciente.
- Responsables.
- Notas importantes.
- Alertas y alergias.
- Historial clinico.
- Historial grooming.
- Historial hospitalizaciones.
- Laboratorios.
- Datos de control.
- Procedimientos.
- Diagnosticos.
- Prescripciones.
- Archivos adjuntos.
- Vacunas.
- Recordatorios.
- Actividad.

### No entra

- Motor medico experto.
- Codificacion clinica exhaustiva.
- Portal externo para responsables.

### Dependencias

- Ficha de paciente actual.
- Ordenes clinicas.
- Seguimientos.
- Futura recepcion.

### Riesgo

Sobrecargar la ficha si se intenta meter todo en una sola pantalla sin jerarquia.

### Valor

Muy alto. Es el corazon clinico del producto.

## Fase 3 - Recordatorios generales

### Objetivo

Pasar de seguimientos clinicos basicos a recordatorios operativos generales.

### Entra

- Tipos de recordatorio generales.
- Vencidos.
- Proximos 7 dias.
- Proximos 30 dias.
- Lista navegable al hacer clic.
- Visibilidad desde Inicio.
- Relacion con paciente y cliente cuando aplique.

### No entra

- WhatsApp automatico.
- Email automatico.
- Campanas masivas.

### Dependencias

- Paciente.
- Clientes.
- Inicio.

### Riesgo

Confundir recordatorio con cita si no se mantiene clara la diferencia entre tarea pendiente y evento programado.

### Valor

Alto. Mejora retencion, seguimiento y operacion diaria.

## Fase 4 - Grooming real

### Objetivo

Crear el modulo operativo de grooming separado de consulta clinica.

### Entra

- Lista/tablero de grooming.
- Banos, grooming, cortes, deslanado y desmotado.
- Servicios y combos configurables.
- Estado del servicio.
- Observaciones del paciente visibles.
- Notas de manejo.
- Entrada desde Agenda y Recepcion.

### No entra

- Consumo automatico de inventario.
- Comisiones complejas.
- Rutas de movilidad.

### Dependencias

- Agenda por areas.
- Recepcion.
- Catalogo de servicios.
- Notas importantes del paciente.

### Riesgo

Tratar grooming como una cita clinica mas y perder su operacion propia.

### Valor

Alto. Responde a una necesidad operativa real y separa visualmente areas de trabajo.

## Fase 5 - Hospitalizaciones

### Objetivo

Crear un modulo propio para pacientes internados.

### Entra

- Alta de internamiento.
- Diagnostico presuntivo.
- Signos vitales: temperatura, FR, FC, peso.
- Fecha/hora de ingreso.
- Tiempo estimado.
- Medico tratante.
- Suero.
- Farmacos, dosis y frecuencia.
- Registros de comida, orina y heces.
- TLC, mucosas y deshidratacion.
- Observaciones.
- Alta.
- Visibilidad desde Paciente 360.

### No entra

- Camas/jaulas avanzadas.
- Facturacion hospitalaria compleja.
- Protocolos automatizados.

### Dependencias

- Paciente 360.
- Recepcion.
- Orden clinica.

### Riesgo

Abrir demasiada complejidad hospitalaria antes de cerrar el flujo minimo.

### Valor

Medio-alto. Es clave para clinicas con internamiento, pero debe venir despues de ordenar recepcion y paciente.

## Fase 6 - Cirugias

### Objetivo

Agregar logica quirurgica propia sin poner Cirugias en el nav principal al inicio.

### Entra

- Cirugias como eventos programados en Agenda.
- Tipo de cirugia.
- Medico.
- Asistentes.
- Precio.
- Examenes.
- Riesgo.
- Materiales.
- Anestesia.
- Inventario consumido en una fase posterior.

### No entra

- Modulo visible en nav principal en el corto plazo.
- Sala quirurgica avanzada.
- Protocolos quirurgicos complejos desde el primer corte.

### Dependencias

- Agenda.
- Paciente 360.
- Inventario conectado a servicios.

### Riesgo

Crear un modulo quirurgico demasiado pronto y duplicar ordenes clinicas.

### Valor

Medio. Importante, pero no debe desplazar Recepcion, Paciente 360 o Grooming.

## Fase 7 - Inventario conectado a servicios

### Objetivo

Conectar consumo de productos con servicios reales, sin romper el Inventario MVP.

### Entra

- Productos usados por servicio de grooming.
- Productos usados por procedimientos.
- Consumo manual asistido desde orden/servicio.
- Historial claro de stock.
- Alertas por stock bajo en Inicio.

### No entra

- Lotes y vencimientos avanzados en primera iteracion.
- Compras complejas.
- Costeo avanzado.

### Dependencias

- Inventario MVP.
- Catalogo de servicios.
- Grooming real.
- Orden clinica.

### Riesgo

Descontar stock automaticamente sin que el usuario entienda o confirme el consumo.

### Valor

Alto. Convierte inventario en parte real de la operacion y no solo en almacen aislado.

## 8. Prioridad recomendada

1. Reorganizacion operativa: Recepcion + navegacion objetivo.
2. Inicio operativo: acciones rapidas, grooming de hoy, cirugias proximas, recordatorios y stock bajo.
3. Notas importantes del paciente como capacidad transversal.
4. Paciente 360 incremental.
5. Recordatorios generales.
6. Grooming real.
7. Hospitalizaciones.
8. Cirugias con logica propia.
9. Inventario conectado a servicios.

## 9. Pendientes abiertos

- Definir si Recepcion crea una orden inmediatamente o primero crea un ingreso/cola liviana.
- Definir si emergencia entra como destino propio o como prioridad dentro de clinica.
- Definir modelo minimo de notas importantes del paciente.
- Definir si recordatorios generales viven como tabla nueva o evolucionan desde seguimientos existentes.
- Definir como se relaciona Grooming con Orden de Servicio actual.
- Definir si Hospitalizaciones factura por orden, por estancia o por eventos.
- Definir cuanto de Cirugias se modela antes de conectar inventario.
- Definir permisos por rol para ver caja, editar servicios, gestionar staff y operar hospitalizaciones.

## 10. Que no hacer todavia

- No crear modulo completo de cirugias en navegacion principal.
- No abrir hospitalizaciones antes de Recepcion y Paciente 360.
- No conectar inventario automaticamente a todos los servicios sin flujo de confirmacion.
- No crear WhatsApp automatico antes de cerrar recordatorios generales.
- No abrir reportes avanzados antes de ordenar datos base.
- No borrar rutas de Atenciones o Colas hasta que Recepcion absorba su uso real.
- No convertir Agenda en una mezcla de todo; debe quedar para eventos programados.

## 11. Criterio de exito para beta v1

VetERP estara listo como beta v1 mas solida cuando:

- el usuario pueda entrar por Recepcion o Agenda sin dudar;
- Inicio muestre lo importante del dia;
- Grooming y clinica esten separados visualmente;
- las notas importantes del paciente aparezcan donde importan;
- los recordatorios vencidos/proximos sean accionables;
- Paciente empiece a funcionar como historia longitudinal;
- caja, inventario y catalogo sigan funcionando sin regresiones.

## 12. Resumen ejecutivo

El producto ya tiene suficiente base para dejar de pensar solo en pantallas aisladas. La siguiente etapa debe ordenar la operacion real:

- Agenda para programacion.
- Recepcion para ingreso del dia.
- Paciente como historia longitudinal.
- Grooming y Hospitalizaciones como modulos propios.
- Cirugias primero como programacion, luego como flujo especializado.
- Inventario conectado a servicios solo cuando los servicios esten bien modelados.

El siguiente bloque recomendado es Reorganizacion operativa: Recepcion + navegacion objetivo + mejoras de Inicio.
