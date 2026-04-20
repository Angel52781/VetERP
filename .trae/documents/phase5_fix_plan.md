# Plan para Solucionar Error de Build en Fase 5

## Resumen
La Fase 5 fue evaluada y su lógica central de base de datos, aislamiento multi-tenant, y reglas de negocio funcionan de manera segura y correcta según la documentación. Sin embargo, el build de producción (`npm run build`) **falla** debido a una inconsistencia de tipos entre `z.coerce.number()` (de Zod) y el tipado de `react-hook-form` en el archivo del catálogo. Este plan detalla la corrección necesaria para dar por Lista la Fase 5.

## Análisis del Estado Actual
- **SQL y Base de Datos**: Migraciones ejecutadas, reglas RLS configuradas e integridad referencial (`ON DELETE CASCADE` y `SET NULL`) comprobada.
- **Server Actions**: Seguras. El recálculo de totales ocurre del lado del servidor, asegurando robustez frente a manipulaciones.
- **Build Error**: En `/workspace/veterp/src/app/(operativo)/ajustes/catalogo-client.tsx`, `useForm<ItemCatalogoInput>` recibe un `zodResolver(itemCatalogoSchema)` que contiene un campo `precio_inc` coercido a `number`. `z.coerce.number()` tiene tipo de entrada `unknown`, lo que choca con la expectativa de `react-hook-form` que espera explícitamente el tipo `number`.

## Cambios Propuestos

### 1. `veterp/src/app/(operativo)/ajustes/catalogo-client.tsx`
- **Qué**: Cambiar la definición genérica del formulario para usar el tipo de entrada (`input`) del esquema de Zod.
- **Por qué**: Esto sincroniza los tipos que `zodResolver` espera procesar con los que `react-hook-form` provee, resolviendo el error de inferencia de TypeScript.
- **Cómo**: 
  - Cambiar `const form = useForm<ItemCatalogoInput>({ ... })` a `const form = useForm<z.input<typeof itemCatalogoSchema>>({ ... })` o utilizar un casting temporal explícito que mitigue la diferencia sin sacrificar la validación en tiempo de ejecución. 
  - Opcionalmente, cambiar el esquema de Zod a `z.union([z.string(), z.number()]).transform(v => Number(v))` si `coerce` sigue fallando.
  - Asegurar que `precio_inc` en los valores iniciales sea numérico, y si el input de tipo número lo envía como string, dejar que el resolver lo gestione de forma compatible.

### 2. Actualización de Documentación
- **Qué**: Ajustar el checklist.
- **Por qué**: Confirmar que la Fase 5 compila y está completamente lista para pasar a la Fase 6.
- **Cómo**: Marcar el progreso de Fase 5 como verificado y libre de errores de compilación.

## Supuestos y Decisiones
- Asumimos que el único error que impide la validación exitosa de la Fase 5 es este conflicto de tipos en el formulario de catálogo.
- La decisión de crear la tabla `proveedores` se mantiene porque es necesaria para garantizar la integridad referencial (FK) de `items_catalogo`, aunque su CRUD completo se abordará en la Fase 6.

## Verificación
1. Ejecutar `npm run build` localmente con variables de entorno simuladas.
2. Confirmar que el comando termina con código de salida `0` (Success).
3. Declarar la Fase 5 como **LISTA**.
