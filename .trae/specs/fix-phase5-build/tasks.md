# Tasks

- [x] Task 1: Corregir conflictos de tipos en `catalogo-client.tsx` y `ajustes.ts`.
  - [x] SubTask 1.1: Cambiar el tipado de `useForm` de `ItemCatalogoInput` a `z.input<typeof itemCatalogoSchema>`.
  - [x] SubTask 1.2: Corregir el tipado de `onSubmit` para mapear los inputs a outputs de forma segura.
  - [x] SubTask 1.3: Ajustar el componente `DialogTrigger` para no arrojar errores por la falta de `asChild` si se usa en un entorno estricto de `@base-ui`.
- [x] Task 2: Validar el parche.
  - [x] SubTask 2.1: Ejecutar `npm run build` y confirmar que pasa sin errores.
  - [x] SubTask 2.2: Crear el reporte `/.trae/documents/phase5_build_patch_validation.md`.