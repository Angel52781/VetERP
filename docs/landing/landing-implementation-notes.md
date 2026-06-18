# VetERP Landing - Notas de diseño e implementación futura

## Alcance de esta fase

Este documento registra decisiones de diseño. No autoriza cambios en `src/`, rutas, `proxy.ts` ni autenticación.

## Paleta propuesta

| Token | Valor | Uso |
|---|---:|---|
| Teal principal | `#0F766E` | Acciones, links y señales clave |
| Teal hover | `#115E59` | Hover/pressed |
| Teal suave | `#DDEDEA` | Bandas y fondos clínicos |
| Crema | `#F7F4EC` | Fondo editorial |
| Blanco cálido | `#FFFEFB` | Superficies |
| Grafito | `#263238` | Texto principal |
| Texto secundario | `#64706F` | Copy auxiliar |
| Borde | `#D7DEDA` | Separadores y marcos |
| Ámbar | `#C98538` | Acento secundario limitado |

Antes de implementar, validar contraste WCAG AA de todas las combinaciones.

## Tipografía y escala

- Headings: Manrope o equivalente humanista disponible.
- Body/UI: Inter o equivalente legible.
- H1 desktop: 48-56 px; mobile: 34-38 px.
- Body: 16-18 px; line-height 1.55-1.7.
- Sin letter-spacing negativo.
- Contenedor desktop: máximo 1180 px.
- Escala de espaciado: múltiplos de 8 px.

## Auditoría de assets

### Marca

- `veterp-logo-horizontal-transparent.png`: 2172 × 724, 833795 bytes.
- `veterp-mark-transparent.png`: 1254 × 1254, 934556 bytes.
- `veterp-logo-vertical-primary-transparent.png`: 1122 × 1402, 868556 bytes.

Los archivos existen y son aptos como fuentes maestras, pero deben optimizarse para web antes de producción. Definir dimensiones renderizadas para evitar CLS.

### Screenshots

| Archivo | Estado para landing V1 | Motivo de exclusión / Acción tomada |
|---|---|---|
| `hero-recepcion-dashboard.png` | Aprobado (Sanitizado) | Se aplicó mask blanco en barra superior para ocultar email. |
| `feature-agenda-operativa.png` | Aprobado (Sanitizado) | Se aplicó mask blanco en barra superior para ocultar email. |
| `feature-historia-clinica.png` | Aprobado (Sanitizado) | Se recortó sección inferior para ocultar evento incoherente (2019) y se ocultó email. |
| `feature-hospitalizacion-clinica.png` | Aprobado (Sanitizado) | Se aplicó mask blanco en barra superior para ocultar email. |
| `feature-finanzas-caja.png` | Aprobado (Sanitizado) | Se aplicó mask blanco en barra superior para ocultar email. |
| `feature-atencion-clinica.png` | **Excluido** | Contiene PII real (teléfono y correo del desarrollador). Ocultarlo dejaría un vacío muy notorio en la UI principal. |
| `feature-inventario-stock.png` | **Excluido** | Contiene datos absurdos ("Vacuna CuraTodo" S/ 6000). No es presentable sin recapturar tras modificar BD. |

*Nota: Los archivos sanitizados y aprobados se encuentran listos en `public/landing/screenshots/sanitized/`.*

## Datos demo recomendados

- Emails: usar dominios reservados como `example.com`.
- Teléfonos: usar rangos evidentemente ficticios y consistentes.
- Productos: nombres genéricos y precios plausibles.
- Fechas: ningún evento puede anteceder al nacimiento del paciente.
- Usuario visible: `Usuario demo` o un correo reservado, nunca credenciales reales.
- Clínica: `Clínica Ejemplo` o nombre expresamente autorizado.

## Tratamiento de imágenes

- Hero: relación aproximada 16:10, prioridad de carga alta.
- Agenda/inventario: 16:9.
- Historia clínica: recorte editorial vertical dentro de un viewport fijo; no comprimir toda la captura larga.
- Atención/hospitalización: 5:4 o 4:3 según el bloque.
- Caja + inventario: dos frames con altura visual equivalente.
- Exportar variantes WebP/AVIF y conservar PNG fuente.
- Definir `width`, `height` o `aspect-ratio` en implementación.
- Lazy-load para todas las capturas bajo el fold.

## Prompt operativo para Stitch

El mockup de Stitch se generó sin acceso directo a archivos locales. Sus marcos están etiquetados con los filenames exactos y deben sustituirse por las capturas aprobadas durante la implementación.

Proyecto Stitch: `projects/15134337035864505797`.

- Design system: `assets/85e720101a61471298c26ef97c835e05`.
- Desktop wireframe final: `b49dbaf876524225a03f029ee50828d2` (2560 × 9256).
- Mobile wireframe final: `46a8667188de45dfb0ee6f933b4bdcf8` (780 × 9970, representación 2× de un viewport de 390 px).
- Los screens iniciales con medios generados quedaron reemplazados por estas versiones neutrales para no inventar interfaz ni contenido.

## Criterios de salida antes de implementar

- Copy aprobado sin claims absolutos.
- Capturas bloqueadas recapturadas.
- Email de sesión removido de todas las capturas públicas.
- Variante oficial de cada logo elegida y optimizada.
- Mockup desktop aprobado.
- Adaptación mobile definida a partir del mismo orden de contenido.
- CTA informativo no presenta affordance engañosa de botón funcional.
- Único enlace externo al producto en esta fase: `/login`.
