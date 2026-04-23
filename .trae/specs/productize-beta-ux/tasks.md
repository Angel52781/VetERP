# Tasks

- [x] Task 1: Auto-Onboarding Post-Registro (Prioridad A)
  - [x] SubTask 1.1: Actualizar `src/app/signup/actions.ts` (o donde ocurra la autenticación inicial) para detectar un usuario nuevo sin clínica y auto-generar la clínica (ej. "Clínica de [Email]").
  - [x] SubTask 1.2: En el mismo flujo de auto-onboarding, insertar un registro en `user_clinicas` asignándole el rol `owner`.
  - [x] SubTask 1.3: En el mismo flujo, crear un `Almacén Principal` por defecto (`is_default: true`) para esa clínica.
  - [x] SubTask 1.4: En el mismo flujo, inyectar 3-5 productos/servicios básicos en `items_catalogo` (ej. Consulta General, Vacuna, Desparasitante).

- [x] Task 2: Mejorar el Shell Visual y Navegación Global (Prioridad A/B)
  - [x] SubTask 2.1: Actualizar `src/app/(operativo)/layout.tsx` para reducir el ancho del `Sidebar` (más compacto).
  - [x] SubTask 2.2: Agregar iconos (`lucide-react`) a cada enlace de navegación en la barra lateral.
  - [x] SubTask 2.3: Implementar un indicador visual claro del estado activo (active link) en la navegación.
  - [x] SubTask 2.4: Aplicar un color de fondo global (ej. `bg-slate-50`) al contenedor principal para generar profundidad frente a las tarjetas blancas (`bg-card`).
  - [x] SubTask 2.5: Envolver el contenido principal (`children`) en un contenedor centrado con un ancho máximo razonable (ej. `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).

- [x] Task 3: Crear el Dashboard Operativo Real en `/inicio` (Prioridad A)
  - [x] SubTask 3.1: Reemplazar el mensaje de texto placeholder en `src/app/(operativo)/inicio/page.tsx` por un diseño en cuadrícula (grid) con métricas clave (Tarjetas resumen).
  - [x] SubTask 3.2: Implementar consulta a BD (o acción de servidor) para mostrar: **Citas de Hoy** (filtradas por fecha).
  - [x] SubTask 3.3: Implementar consulta para mostrar: **Ingresos del Día** (sumando ventas pagadas del día actual).
  - [x] SubTask 3.4: Implementar consulta para mostrar: **Órdenes Abiertas** (estado != completado/cancelado).
  - [x] SubTask 3.5: Implementar consulta (opcional) para: **Alertas de Stock Bajo** (ítems de producto con cantidad < 10).

- [x] Task 4: Feedback Visual Global (Toasts) (Prioridad A)
  - [x] SubTask 4.1: Asegurar que el componente `Toaster` de `sonner` o `shadcn/ui` esté integrado en el `layout.tsx` principal.
  - [x] SubTask 4.2: Agregar notificaciones `toast.success` y `toast.error` en las acciones de servidor de creación de Clientes.
  - [x] SubTask 4.3: Agregar notificaciones `toast` en las acciones de Inventario/Caja.
  - [x] SubTask 4.4: Agregar notificaciones `toast` en las acciones de Ajustes (Catálogo/Almacenes/Proveedores).

- [x] Task 5: Mejorar los "Empty States" en Listados Clave (Prioridad B)
  - [x] SubTask 5.1: Crear un componente reutilizable `<EmptyState title="..." description="..." action="..." icon={...} />`.
  - [x] SubTask 5.2: Reemplazar los textos vacíos en `src/app/(operativo)/clientes/page.tsx` (o su cliente) con el nuevo `<EmptyState>` que incluya un CTA para "Crear Nuevo Cliente".
  - [x] SubTask 5.3: Reemplazar textos vacíos en `src/app/(operativo)/ajustes/catalogo-client.tsx` con un `<EmptyState>` y un botón "Agregar Ítem".
  - [x] SubTask 5.4: Reemplazar textos vacíos en Caja e Inventario con el nuevo diseño.

- [x] Task 6: Refinamiento de Formato y Visualización (Prioridad B/C)
  - [x] SubTask 6.1: Crear o mejorar funciones utilitarias en `src/lib/utils.ts` para formateo de moneda (ej. `formatCurrency(amount) -> "$ 1,500.00"`) y fechas (ej. `formatDate(date) -> "21 Abr, 2026"`).
  - [x] SubTask 6.2: Aplicar el formateo de moneda a todas las vistas de Caja, Inventario y Catálogo.
  - [x] SubTask 6.3: Aplicar insignias colorizadas (Badges) para diferenciar visualmente estados (ej. Pagado en verde, Pendiente en naranja) en las tablas.

# Task Dependencies
- [Task 3] depends on [Task 2] (el layout debe estar listo para ubicar bien el dashboard).
- [Task 5] depends on [Task 2] (para heredar el estilo general).
- [Task 6] depends on [Task 5] y [Task 3] (aplicación a tablas y resúmenes).
