-- =============================================================================
-- SEED DEMO — VetERP
-- Usuario: admin1@veterp.com / password123
-- Clínica: Clínica Demo (ID fijo para reproducibilidad)
-- =============================================================================
-- NOTA: Este seed usa el usuario admin1@veterp.com (UUID variable según Supabase).
-- Para correrlo en un entorno limpio, primero crea el usuario admin1@veterp.com
-- desde la UI de Supabase Auth o con el dashboard, y luego sustituye
-- ADMIN_USER_ID por el UUID real que Supabase le asignó.
--
-- Si usas bootstrapDemoAccess (login → select-clinica sin membresía),
-- el sistema crea la clínica demo automáticamente. Este seed complementa
-- con datos operativos reales para pruebas.
-- =============================================================================

-- ─── IDs fijos de demo ────────────────────────────────────────────────────────
-- Clínica: 22222222-2222-4222-a222-222222222222
-- Almacén: 33333333-3333-4333-a333-333333333333
-- Proveedor: 44444444-4444-4444-a444-444444444444
-- Catálogo (servicios): 5555...51, 5555...52, 5555...53
-- Clientes: aa00...01..05
-- Mascotas: bb00...01..08
-- Tipo Cita: cc00...01, cc00...02
-- Citas: dd00...01..06
-- Órdenes: ee00...01..05
-- Ventas: ff00...01, ff00...02

-- ─── CATÁLOGO EXTENDIDO ───────────────────────────────────────────────────────
INSERT INTO public.items_catalogo (id, clinica_id, nombre, descripcion, kind, precio_inc, proveedor_id, is_disabled)
VALUES
  ('55555555-5555-4555-a555-555555555551', '22222222-2222-4222-a222-222222222222', 'Consulta General', 'Consulta clínica de rutina', 'servicio', 50.00, null, false),
  ('55555555-5555-4555-a555-555555555552', '22222222-2222-4222-a222-222222222222', 'Vacuna Antirrábica', 'Vacuna anual antirrábica', 'producto', 25.00, '44444444-4444-4444-a444-444444444444', false),
  ('55555555-5555-4555-a555-555555555553', '22222222-2222-4222-a222-222222222222', 'Desparasitante Interno', 'Pastilla desparasitante oral', 'producto', 15.00, '44444444-4444-4444-a444-444444444444', false),
  ('55555555-5555-4555-a555-555555555554', '22222222-2222-4222-a222-222222222222', 'Limpieza Dental', 'Limpieza dental con ultrasonido', 'servicio', 80.00, null, false),
  ('55555555-5555-4555-a555-555555555555', '22222222-2222-4222-a222-222222222222', 'Radiografía', 'Radiografía digital simple', 'servicio', 45.00, null, false),
  ('55555555-5555-4555-a555-555555555556', '22222222-2222-4222-a222-222222222222', 'Antipulgas Spot-On', 'Pipeta antiparasitaria externa', 'producto', 18.00, '44444444-4444-4444-a444-444444444444', false)
ON CONFLICT (id) DO NOTHING;

-- ─── STOCK INICIAL ────────────────────────────────────────────────────────────
INSERT INTO public.movimientos_stock (clinica_id, item_id, almacen_id, qty, tipo, notas)
VALUES
  ('22222222-2222-4222-a222-222222222222', '55555555-5555-4555-a555-555555555552', '33333333-3333-4333-a333-333333333333', 100, 'entrada', 'Inventario inicial demo'),
  ('22222222-2222-4222-a222-222222222222', '55555555-5555-4555-a555-555555555553', '33333333-3333-4333-a333-333333333333', 200, 'entrada', 'Inventario inicial demo'),
  ('22222222-2222-4222-a222-222222222222', '55555555-5555-4555-a555-555555555556', '33333333-3333-4333-a333-333333333333', 50,  'entrada', 'Inventario inicial demo')
ON CONFLICT DO NOTHING;

-- ─── CLIENTES DEMO ────────────────────────────────────────────────────────────
INSERT INTO public.clientes (id, clinica_id, nombre, telefono, email)
VALUES
  ('aa000000-0000-4000-a000-000000000001', '22222222-2222-4222-a222-222222222222', 'María García López',    '555-0101', 'maria.garcia@email.com'),
  ('aa000000-0000-4000-a000-000000000002', '22222222-2222-4222-a222-222222222222', 'Carlos Rodríguez Pérez','555-0202', 'carlos.r@email.com'),
  ('aa000000-0000-4000-a000-000000000003', '22222222-2222-4222-a222-222222222222', 'Ana Martínez Soto',     '555-0303', null),
  ('aa000000-0000-4000-a000-000000000004', '22222222-2222-4222-a222-222222222222', 'Jorge Hernández Cruz',  '555-0404', 'jorge.h@email.com'),
  ('aa000000-0000-4000-a000-000000000005', '22222222-2222-4222-a222-222222222222', 'Laura Jiménez Ruiz',    null,       'laura.j@email.com')
ON CONFLICT (id) DO NOTHING;

-- ─── MASCOTAS DEMO ────────────────────────────────────────────────────────────
INSERT INTO public.mascotas (id, clinica_id, cliente_id, nombre, especie, raza, nacimiento)
VALUES
  ('bb000000-0000-4000-a000-000000000001', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000001', 'Luna',    'Perro',  'Labrador Retriever', '2020-03-15'),
  ('bb000000-0000-4000-a000-000000000002', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000001', 'Michi',   'Gato',   'Siamés',             '2021-07-20'),
  ('bb000000-0000-4000-a000-000000000003', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000002', 'Max',     'Perro',  'Pastor Alemán',      '2019-11-05'),
  ('bb000000-0000-4000-a000-000000000004', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000003', 'Canela',  'Perro',  'Beagle',             '2022-01-10'),
  ('bb000000-0000-4000-a000-000000000005', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000003', 'Mittens', 'Gato',   'Mestizo',            '2020-09-30'),
  ('bb000000-0000-4000-a000-000000000006', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000004', 'Rocky',   'Perro',  'Bulldog Francés',    '2021-04-18'),
  ('bb000000-0000-4000-a000-000000000005', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000005', 'Perla',   'Conejo', 'Enano Holandés',     '2023-02-14'),
  ('bb000000-0000-4000-a000-000000000004', '22222222-2222-4222-a222-222222222222', 'aa000000-0000-4000-a000-000000000004', 'Tobi',    'Perro',  'Golden Retriever',   '2018-06-22')
ON CONFLICT (id) DO NOTHING;

-- ─── TIPOS DE CITA ────────────────────────────────────────────────────────────
INSERT INTO public.tipo_citas (id, clinica_id, nombre, duracion_min, color, is_disabled)
VALUES
  ('cc000000-0000-4000-a000-000000000001', '22222222-2222-4222-a222-222222222222', 'Consulta General', 30,  '#3B82F6', false),
  ('cc000000-0000-4000-a000-000000000002', '22222222-2222-4222-a222-222222222222', 'Vacunación',       20,  '#10B981', false),
  ('cc000000-0000-4000-a000-000000000003', '22222222-2222-4222-a222-222222222222', 'Cirugía',          120, '#EF4444', false),
  ('cc000000-0000-4000-a000-000000000004', '22222222-2222-4222-a222-222222222222', 'Control',          20,  '#8B5CF6', false)
ON CONFLICT (id) DO NOTHING;

-- ─── CITAS DEMO (hoy y próximos días + pasadas) ──────────────────────────────
INSERT INTO public.citas (id, clinica_id, cliente_id, mascota_id, tipo_cita_id, estado, start_date, end_date)
VALUES
  -- Hoy
  ('dd000000-0000-4000-a000-000000000001', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000001',
   'cc000000-0000-4000-a000-000000000001', 'programada',
   (now()::date + interval '9 hours'), (now()::date + interval '9 hours 30 minutes')),

  ('dd000000-0000-4000-a000-000000000002', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000002', 'bb000000-0000-4000-a000-000000000003',
   'cc000000-0000-4000-a000-000000000002', 'programada',
   (now()::date + interval '11 hours'), (now()::date + interval '11 hours 20 minutes')),

  ('dd000000-0000-4000-a000-000000000003', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000003', 'bb000000-0000-4000-a000-000000000004',
   'cc000000-0000-4000-a000-000000000001', 'confirmada',
   (now()::date + interval '15 hours'), (now()::date + interval '15 hours 30 minutes')),

  -- Próximos días
  ('dd000000-0000-4000-a000-000000000004', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000004', 'bb000000-0000-4000-a000-000000000006',
   'cc000000-0000-4000-a000-000000000003', 'programada',
   (now() + interval '2 days')::date + interval '10 hours',
   (now() + interval '2 days')::date + interval '12 hours'),

  ('dd000000-0000-4000-a000-000000000005', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000005', 'bb000000-0000-4000-a000-000000000007',
   'cc000000-0000-4000-a000-000000000004', 'programada',
   (now() + interval '3 days')::date + interval '14 hours',
   (now() + interval '3 days')::date + interval '14 hours 20 minutes'),

  -- Pasada (completada)
  ('dd000000-0000-4000-a000-000000000006', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000002',
   'cc000000-0000-4000-a000-000000000002', 'completada',
   (now() - interval '5 days'), (now() - interval '5 days' + interval '20 minutes'))
ON CONFLICT (id) DO NOTHING;

-- ─── ÓRDENES DE SERVICIO DEMO ─────────────────────────────────────────────────
INSERT INTO public.ordenes_servicio (id, clinica_id, cliente_id, mascota_id, estado_text, started_at, finished_at)
VALUES
  -- Activas
  ('ee000000-0000-4000-a000-000000000001', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000001',
   'open', now() - interval '25 minutes', null),

  ('ee000000-0000-4000-a000-000000000002', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000002', 'bb000000-0000-4000-a000-000000000003',
   'in_progress', now() - interval '1 hour 10 minutes', null),

  ('ee000000-0000-4000-a000-000000000003', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000003', 'bb000000-0000-4000-a000-000000000005',
   'open', now() - interval '5 minutes', null),

  -- Cerradas
  ('ee000000-0000-4000-a000-000000000004', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000004', 'bb000000-0000-4000-a000-000000000006',
   'finished', now() - interval '2 days', now() - interval '2 days' + interval '45 minutes'),

  ('ee000000-0000-4000-a000-000000000005', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000001', 'bb000000-0000-4000-a000-000000000002',
   'closed', now() - interval '7 days', now() - interval '7 days' + interval '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- ─── VENTA + ITEMS + PAGO (orden cerrada, para historial de caja) ─────────────
INSERT INTO public.ventas (id, clinica_id, cliente_id, orden_id, estado, total)
VALUES
  ('ff000000-0000-4000-a000-000000000001', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000004', 'ee000000-0000-4000-a000-000000000004',
   'pagada', 75.00),
  ('ff000000-0000-4000-a000-000000000002', '22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000001', 'ee000000-0000-4000-a000-000000000005',
   'pagada', 65.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.items_venta (clinica_id, venta_id, item_id, cantidad, precio_unitario, total_linea)
VALUES
  ('22222222-2222-4222-a222-222222222222', 'ff000000-0000-4000-a000-000000000001',
   '55555555-5555-4555-a555-555555555551', 1, 50.00, 50.00),
  ('22222222-2222-4222-a222-222222222222', 'ff000000-0000-4000-a000-000000000001',
   '55555555-5555-4555-a555-555555555552', 1, 25.00, 25.00),
  ('22222222-2222-4222-a222-222222222222', 'ff000000-0000-4000-a000-000000000002',
   '55555555-5555-4555-a555-555555555551', 1, 50.00, 50.00),
  ('22222222-2222-4222-a222-222222222222', 'ff000000-0000-4000-a000-000000000002',
   '55555555-5555-4555-a555-555555555553', 1, 15.00, 15.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.ledger (clinica_id, cliente_id, venta_id, orden_id, tipo, monto, fecha)
VALUES
  ('22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000004',
   'ff000000-0000-4000-a000-000000000001',
   'ee000000-0000-4000-a000-000000000004',
   'pago', 75.00, now() - interval '2 days'),
  ('22222222-2222-4222-a222-222222222222',
   'aa000000-0000-4000-a000-000000000001',
   'ff000000-0000-4000-a000-000000000002',
   'ee000000-0000-4000-a000-000000000005',
   'pago', 65.00, now() - interval '7 days')
ON CONFLICT DO NOTHING;

-- ─── FIN DEL SEED ─────────────────────────────────────────────────────────────
-- Cómo aplicar:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Pegar este archivo y ejecutar
-- 3. Asegurarse de que admin1@veterp.com tenga membresía a la clínica 22222222-...
--    Si no, usar bootstrapDemoAccess (login con cuenta sin clínica → select-clinica)
--    o insertar manualmente:
--    INSERT INTO public.user_clinicas (user_id, clinica_id, role)
--    VALUES ('<UUID_DE_ADMIN1>', '22222222-2222-2222-2222-222222222222', 'owner')
--    ON CONFLICT DO NOTHING;