# VetERP Landing - Wireframe visual

## Estado

- Fase: diseño y planificación, sin implementación.
- Formato principal: landing pública desktop 1440 px con adaptación mobile.
- Stitch project: `projects/15134337035864505797`.
- Stitch desktop wireframe: `b49dbaf876524225a03f029ee50828d2`.
- Stitch mobile wireframe: `46a8667188de45dfb0ee6f933b4bdcf8`.
- Stitch design system: `assets/85e720101a61471298c26ef97c835e05`.
- Objetivo: comunicar un producto real en beta privada sin simular compra, registro abierto ni formulario comercial.

## Concepto visual

**Calma operativa.** La landing debe transmitir que VetERP ordena el trabajo diario de una clínica sin convertirlo en una interfaz corporativa pesada. Los screenshots reales son la evidencia principal; la decoración debe ser mínima.

Principios:

- Base crema cálida, superficies blanco cálido y texto grafito.
- Teal profundo reservado para navegación, acciones y señales de producto.
- Mucho espacio vertical y composición editorial.
- Bordes de 8 px como máximo y sombras suaves.
- Sin glassmorphism, blobs, orbes, gradientes dominantes ni cards anidadas.
- Una sola acción real de navegación: **Iniciar sesión**.
- “Beta privada — próximamente disponible” se presenta como estado informativo, no como botón falso.

## Estructura desktop

### 1. Navbar

- Altura contenida, fondo blanco cálido y borde inferior sutil.
- Izquierda: `veterp-logo-horizontal-transparent.png`.
- Centro: anclas `Producto`, `Flujo`, `Beta privada`.
- Derecha: enlace secundario `Iniciar sesión` hacia `/login`.
- No incluir `/signup`, precios ni solicitud de acceso.

### 2. Hero

- Banda crema de ancho completo.
- Copy centrado, sin card y sin layout dividido texto/imagen.
- Badge pequeño: `Beta privada`.
- H1: `Organiza la operación diaria de tu clínica veterinaria.`
- Subcopy de máximo 2-3 líneas.
- Estado informativo: `Beta privada — próximamente disponible`.
- Acción secundaria: `Iniciar sesión`.
- Debajo, screenshot dominante `hero-recepcion-dashboard.png` en marco de navegador sobrio.
- El primer viewport debe dejar visible el inicio de la siguiente sección.

### 3. Beneficio operativo

Banda blanca cálida sin cards flotantes.

- Eyebrow: `Una operación más clara`.
- Título: `El contexto que tu equipo necesita, donde lo necesita.`
- Tres beneficios en columnas:
  - Orden diario.
  - Continuidad clínica.
  - Control operativo.

### 4. Recorrido del producto

Título de sección: `Un flujo que acompaña el trabajo de la clínica.`

#### Agenda organizada por área

- Screenshot: `feature-agenda-operativa.png`.
- Imagen grande y copy breve en una columna secundaria.
- Mostrar agenda como organización de citas, no como automatización.

#### Historia del paciente

- Screenshot: `feature-historia-clinica.png`.
- Usar una ventana de recorte vertical; no mostrar los 2912 px completos.
- Priorizar cabecera, alertas, filtros y primeras entradas de la línea de tiempo.
- No usar el término visible “Paciente 360”.

#### Atención clínica con contexto

- Screenshot: `feature-atencion-clinica.png` después de recaptura segura.
- Enfatizar contexto reciente y registro de atención.
- No ampliar datos de contacto del responsable.

#### Caja e inventario como soporte

- Banda de dos imágenes: `feature-finanzas-caja.png` y `feature-inventario-stock.png`.
- Las imágenes tienen igual jerarquía; no presentarlas como contabilidad completa.
- En mobile se apilan en ese orden.

#### Seguimiento durante la hospitalización

- Screenshot: `feature-hospitalizacion-clinica.png`.
- Tratamiento sobrio, con caption `Módulo mostrado con alcance de beta privada`.
- No usar claims de gestión hospitalaria integral.

### 5. Cómo funciona la beta privada

Banda teal suave de ancho completo.

1. `Validación controlada`: se prueba con un grupo limitado de clínicas.
2. `Acceso progresivo`: las nuevas cuentas se habilitarán gradualmente.
3. `Aprendizaje cercano`: el feedback operativo orienta las siguientes mejoras.

No prometer fecha, onboarding formal, soporte premium ni acceso inmediato.

### 6. Cierre

- Banda crema con `veterp-mark-transparent.png`.
- Título: `Una forma más clara de coordinar el día a día de tu clínica.`
- Estado: `Beta privada — próximamente disponible`.
- Enlace: `Iniciar sesión`.
- Footer compacto con `Producto`, `Beta privada` e `Iniciar sesión`.

## Comportamiento mobile

- Navbar con logo, `Iniciar sesión` y menú para las anclas internas.
- H1 máximo 38 px y cuerpo mínimo 16 px.
- Screenshot del hero conserva relación de aspecto y permite leer la interfaz principal.
- Todos los recorridos se apilan: copy antes de screenshot.
- Caja e inventario se muestran en bloques consecutivos.
- Objetivos táctiles mínimos de 44 px.
- Sin carruseles obligatorios ni scroll horizontal.

Referencia Stitch mobile: `46a8667188de45dfb0ee6f933b4bdcf8`.

## Ritmo de página

1. Marca y promesa.
2. Evidencia inmediata del producto.
3. Beneficio operativo.
4. Recorrido funcional con screenshots.
5. Explicación transparente de la beta.
6. Cierre informativo y acceso para usuarios existentes.
