# Fix Phase 5 Build Spec

## Why
El build de producción (`npm run build`) de la Fase 5 falla debido a un conflicto de tipos entre `z.coerce.number()` en el esquema de Zod y el tipado estricto esperado por `react-hook-form` en el formulario del catálogo.

## What Changes
- Se actualizará la inicialización del formulario en `src/app/(operativo)/ajustes/catalogo-client.tsx` para utilizar `z.input<typeof itemCatalogoSchema>` en lugar de `ItemCatalogoInput` (que representa el output).
- Se asegurará que el `onSubmit` mapee correctamente los tipos.
- Se corregirá cualquier conflicto de compatibilidad entre los componentes de UI (como `DialogTrigger`) y el tipado estricto.

## Impact
- Affected specs: Fase 5 (Catálogo de Ítems).
- Affected code: `src/app/(operativo)/ajustes/catalogo-client.tsx`, `src/lib/validators/ajustes.ts`.

## MODIFIED Requirements
### Requirement: Formulario de Catálogo de Ítems
El formulario debe compilar correctamente en producción (TypeScript estricto) manteniendo la validación en tiempo de ejecución para `precio_inc` y el resto de campos.
