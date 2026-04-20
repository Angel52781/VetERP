# Implement Phase 7: Hardening, QA, and Permissions Spec

## Why
El proyecto se encuentra en su última fase antes de la validación final. Es imperativo asegurar que el sistema sea resistente (hardening), que cumzca con las mejores prácticas de seguridad, de React (Vercel best practices), y que los permisos (RBAC) eviten que usuarios no autorizados (ej. veterinarios base o recepcionistas) modifiquen configuraciones, catálogos, finanzas u otros ajustes críticos.

## What Changes
- **RBAC / Autorización**:
  - Implementar lógica en Middleware, Server Actions y UI para restringir el acceso basándose en el rol del usuario (almacenado en `user_clinicas.role`).
  - Roles definidos (según inferencia de la reconstrucción): `owner` / `admin` (acceso total), `veterinario` (acceso a pacientes y órdenes, no a finanzas ni ajustes), `recepcionista` (acceso a agenda, caja básica y clientes, sin ajustes de sistema).
  - Bloquear Server Actions críticos si el usuario no tiene los permisos suficientes.
- **Hardening & Security**:
  - Revisión y ajuste final de validaciones Zod para asegurar que no se procese información maliciosa (ej. XSS).
  - Asegurarse de que ningún endpoint de la base de datos (Supabase) permita operaciones masivas no deseadas (Rate limiting básico en acciones, manejo de UUIDs correctos).
- **React Best Practices**:
  - Asegurar correcta paralelización de promesas (`Promise.all`) en los Server Components donde aplique (ej. Dashboards).
  - Evitar fugas de memoria o re-renders innecesarios.
- **Seed Data Mínima**:
  - Proveer un script SQL (`supabase/seed.sql`) o una Server Action que genere los datos iniciales necesarios para probar la aplicación End-to-End (Clínica, Usuario, Cliente, Mascota, Almacén, Ítem Catalogo, Proveedor).

## Impact
- Affected specs: Fase 7 (Toda la aplicación).
- Affected code:
  - `src/lib/clinica.ts` (helper de autorización).
  - `src/app/(operativo)/ajustes/*` (Protección de rutas/UI).
  - `src/app/(operativo)/caja_inventario/*` (Protección de modificaciones).
  - Server Actions en múltiples archivos.
  - `supabase/seed.sql`.

## ADDED Requirements
### Requirement: Control de Acceso Basado en Roles (RBAC)
El sistema DEBE verificar el rol del usuario activo en la clínica actual antes de permitir operaciones de mutación sensibles (Crear, Actualizar, Eliminar) sobre entidades maestras o financieras.

#### Scenario: Acceso Denegado a Ajustes
- **WHEN** un usuario con rol `veterinario` intenta acceder a la ruta `/ajustes`
- **THEN** el sistema debe redirigirlo al `index` o mostrar una pantalla de "Acceso Denegado".

## MODIFIED Requirements
### Requirement: Server Actions
Las Server Actions existentes (ej. `createItemCatalogo`, `addMovimientoStock`, `registrarPago`) DEBEN comprobar internamente si el usuario posee los privilegios necesarios antes de ejecutar la mutación.
