-- Seed base de Inventario para todas las clínicas existentes
-- Inserta datos por defecto solo si no existen previamente

-- 1. Categorías sugeridas
INSERT INTO public.categorias_catalogo (clinica_id, nombre, descripcion)
SELECT 
    c.id as clinica_id, 
    v.nombre, 
    'Categoría generada automáticamente' as descripcion
FROM public.clinicas c
CROSS JOIN (
    VALUES 
        ('Medicamentos'),
        ('Vacunas'),
        ('Alimentos'),
        ('Insumos médicos'),
        ('Higiene / Grooming'),
        ('Servicios'),
        ('Otros')
) AS v(nombre)
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.categorias_catalogo cc 
    WHERE cc.clinica_id = c.id AND cc.nombre = v.nombre
);

-- 2. Almacén principal
INSERT INTO public.almacenes (clinica_id, nombre, ubicacion, is_default)
SELECT 
    c.id as clinica_id, 
    'Almacén Principal', 
    'Sede Principal', 
    true
FROM public.clinicas c
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.almacenes a 
    WHERE a.clinica_id = c.id AND a.nombre = 'Almacén Principal'
);

-- 3. Proveedor demo
INSERT INTO public.proveedores (clinica_id, nombre, contacto, telefono)
SELECT 
    c.id as clinica_id, 
    'Proveedor Demo', 
    'Contacto Demo', 
    '000000000'
FROM public.clinicas c
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.proveedores p 
    WHERE p.clinica_id = c.id AND p.nombre = 'Proveedor Demo'
);
