# Tasks

- [x] Task 1: Fase 7 - Autorización y Roles (RBAC)
  - [x] SubTask 1.1: Crear un helper en `src/lib/clinica.ts` (ej. `requireUserRole(roles)`) que obtenga y valide `user_clinicas.role` (owner/admin/veterinario/recepcionista).
  - [x] SubTask 1.2: Restringir acceso en la interfaz de usuario. Ocultar o deshabilitar pestañas/menús (`/ajustes`, `/caja_inventario` según aplique) si el rol no lo permite.
  - [x] SubTask 1.3: Proteger las Server Actions críticas (`createItemCatalogo`, `updateItemCatalogo`, `createAlmacen`, `addMovimientoStock`, etc.) inyectando el helper de validación de rol.
- [x] Task 2: Fase 7 - Hardening y Seguridad
  - [x] SubTask 2.1: Revisar y ajustar las validaciones Zod (sanitización de inputs de texto libre para evitar XSS o errores lógicos).
  - [x] SubTask 2.2: Validar el manejo de errores (no exponer stack traces de la base de datos a la UI a través de las Server Actions).
- [x] Task 3: Fase 7 - React Best Practices (Performance)
  - [x] SubTask 3.1: Paralelizar peticiones a base de datos (Promise.all) en vistas complejas (ej. `/caja_inventario`, `orden_y_colas`).
  - [x] SubTask 3.2: Confirmar la eliminación de waterfalls innecesarios en componentes cliente/servidor y asegurar la hidratación.
- [x] Task 4: Fase 7 - Seed Data Mínima Final
  - [x] SubTask 4.1: Crear script de inicialización de base de datos (`supabase/seed.sql`) o función de Server Action que provea un catálogo base (Almacén principal, Proveedor Demo, Items Base) para pruebas E2E.
- [x] Task 5: Validación Final (Fase 7)
  - [x] SubTask 5.1: Ejecutar `npm run build` para asegurar la compilación.
  - [x] SubTask 5.2: Crear el reporte final `/.trae/documents/phase7_validation.md` validando todo el checklist y determinando la decisión final de la aplicación.