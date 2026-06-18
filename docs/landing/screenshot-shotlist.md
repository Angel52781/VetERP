# Shotlist de Capturas de Pantalla (Screenshots) para VetERP Landing

Para la landing page se requieren capturas de pantalla de la interfaz que demuestren que el producto existe, es moderno y tiene un diseÃ±o profesional.

## Protocolo Seguro de Screenshots (CRÃTICO)
- Usar un tenant (clÃ­nica) demo aislado.
- NO usar datos reales de pacientes o clientes.
- NO mostrar credenciales, emails reales ni telÃ©fonos de usuarios verdaderos.
- NO mostrar UUIDs expuestos en la UI.
- NO mostrar variables tÃ©cnicas o textos raw como `null`, `undefined`, `SOAP`, `HCE`, `estado_text`, `tipo_text`, `ORD-`, `VTA-`.
- NO mostrar registros basura tipo `test`, `sdasd`, `prueba`, `NanDown`.
- NO mostrar fechas imposibles (ej. antecedentes con fecha anterior al nacimiento del paciente).
- NO usar pantallas vacÃ­as (empty states) salvo que se justifique para mostrar simplicidad.

## 1. Hero Image / RecepciÃ³n (Inicio)
- **Ruta exacta:** `/recepcion`
- **Pantalla:** RecepciÃ³n limpia y operativa.
- **Estado esperado:** Vista de control diaria con pacientes en espera o atenciÃ³n.
- **Datos demo requeridos:** Mascotas reales ("Luna", "Max"), razas y horas coherentes.
- **Viewport recomendado:** Desktop 1440px.
- **Nombre de archivo sugerido:** `hero-recepcion-1440.webp`
- **Prioridad:** Alta
- **QuÃ© NO debe aparecer:** UUIDs, textos `null`, o exceso de ruido visual.

## 2. Paciente 360 e Historia ClÃ­nica
- **Ruta exacta:** `/pacientes/[id]`
- **Pantalla:** Ficha del paciente y lÃ­nea de tiempo clÃ­nica.
- **Estado esperado:** Historial claro mostrando la vida del paciente en la clÃ­nica.
- **Datos demo requeridos:** Entradas de historial coherentes y limpias.
- **Viewport recomendado:** Desktop 1440px.
- **Nombre de archivo sugerido:** `feature-paciente-360.webp`
- **Prioridad:** Alta
- **QuÃ© NO debe aparecer:** Datos tÃ©cnicos expuestos como `HCE`.

## 3. AtenciÃ³n ClÃ­nica y Contexto Reciente
- **Ruta exacta:** `/atenciones/[id]`
- **Pantalla:** Interfaz de atenciÃ³n mÃ©dica.
- **Estado esperado:** Registro mÃ©dico profesional en curso, apoyado por contexto reciente.
- **Datos demo requeridos:** Motivo de consulta descriptivo, constantes vitales realistas.
- **Viewport recomendado:** Desktop 1440px.
- **Nombre de archivo sugerido:** `feature-atencion-clinica.webp`
- **Prioridad:** Alta
- **QuÃ© NO debe aparecer:** Textos truncados o registros sin sentido.

## 4. GestiÃ³n de Agenda (Calendario)
- **Ruta exacta:** `/agenda`
- **Pantalla:** Calendario semanal o diario.
- **Estado esperado:** Agenda con bloques de colores diferenciados.
- **Datos demo requeridos:** Citas de "Consulta General", "BaÃ±o", y "VacunaciÃ³n".
- **Viewport recomendado:** Desktop 1440px.
- **Nombre de archivo sugerido:** `feature-agenda.webp`
- **Prioridad:** Alta

## 5. Caja e Inventario
- **Ruta exacta:** `/caja` o `/inventario`
- **Pantalla:** Pantalla de cobro o listado de stock.
- **Estado esperado:** Listado de productos u orden de servicio lista para pagar, demostrando capacidad ERP.
- **Datos demo requeridos:** Productos reconocibles (ej. "Bravecto"), precios en moneda local creÃ­bles.
- **Viewport recomendado:** Desktop 1440px.
- **Nombre de archivo sugerido:** `feature-caja.webp`
- **Prioridad:** Alta
- **QuÃ© NO debe aparecer:** Errores de cÃ¡lculo o prefijos internos `ORD-`/`VTA-` crudos.
