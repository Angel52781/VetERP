-- Asegurarse de que la extensión existe (por si acaso, aunque parece que ya está habilitada en Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert into auth.users (Usamos un hash de bcrypt ya generado para "password123" para evitar problemas con gen_salt)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@veterp.com', '$2a$10$0dM1oFqD7R6w5/kU9X9QOOzN9XzX2/M3J2eG8/O9E1aH9c7/c9K5e', now(), 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert into public.clinicas
INSERT INTO public.clinicas (id, nombre, created_by)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Clínica Demo', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.user_clinicas
INSERT INTO public.user_clinicas (user_id, clinica_id, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'owner')
ON CONFLICT (user_id, clinica_id) DO NOTHING;

-- Insert into public.almacenes
INSERT INTO public.almacenes (id, clinica_id, nombre, is_default)
VALUES 
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Almacén Principal', true)
ON CONFLICT (id) DO NOTHING;

-- Insert into public.proveedores
INSERT INTO public.proveedores (id, clinica_id, nombre, contacto, telefono)
VALUES 
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Distribuidora Veterinaria Sur', 'Juan Perez', '555-1234'),
  ('44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222222', 'Laboratorios PetFarma', 'María Gómez', '555-5678')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.items_catalogo (10 items: 5 productos, 5 servicios)
INSERT INTO public.items_catalogo (id, clinica_id, nombre, descripcion, kind, precio_inc, proveedor_id)
VALUES 
  ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222', 'Consulta General', 'Consulta general de rutina', 'servicio', 50.00, null),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222', 'Vacuna Antirrábica', 'Vacuna anual antirrábica', 'producto', 25.00, '44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222', 'Desparasitante Interno', 'Pastilla desparasitante de amplio espectro', 'producto', 15.00, '44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222222', 'Consulta de Especialidad', 'Consulta con especialista', 'servicio', 80.00, null),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Radiografía Digital', 'Estudio radiográfico', 'servicio', 65.00, null),
  ('55555555-5555-5555-5555-555555555556', '22222222-2222-2222-2222-222222222222', 'Ecografía Abdominal', 'Ecografía de abdomen completo', 'servicio', 75.00, null),
  ('55555555-5555-5555-5555-555555555557', '22222222-2222-2222-2222-222222222222', 'Pipeta Antipulgas', 'Antipulgas y garrapatas mensual', 'producto', 18.00, '44444444-4444-4444-4444-444444444445'),
  ('55555555-5555-5555-5555-555555555558', '22222222-2222-2222-2222-222222222222', 'Alimento Premium 3kg', 'Alimento seco premium para perro adulto', 'producto', 35.00, '44444444-4444-4444-4444-444444444445'),
  ('55555555-5555-5555-5555-555555555559', '22222222-2222-2222-2222-222222222222', 'Collar Isabelino Talla M', 'Collar protector de recuperación', 'producto', 12.00, '44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-55555555555a', '22222222-2222-2222-2222-222222222222', 'Limpieza Dental', 'Profilaxis dental bajo sedación', 'servicio', 120.00, null)
ON CONFLICT (id) DO NOTHING;

-- Insert into public.clientes (3 clientes)
INSERT INTO public.clientes (id, clinica_id, nombre, telefono, email)
VALUES 
  ('66666666-6666-6666-6666-666666666661', '22222222-2222-2222-2222-222222222222', 'Carlos García', '555-0101', 'carlos@example.com'),
  ('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222', 'María Rodríguez', '555-0102', 'maria@example.com'),
  ('66666666-6666-6666-6666-666666666663', '22222222-2222-2222-2222-222222222222', 'Laura Fernández', '555-0103', 'laura@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.mascotas (5 mascotas)
INSERT INTO public.mascotas (id, clinica_id, cliente_id, nombre, especie, raza, nacimiento)
VALUES 
  ('77777777-7777-7777-7777-777777777771', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', 'Max', 'Perro', 'Golden Retriever', '2019-05-12'),
  ('77777777-7777-7777-7777-777777777772', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', 'Luna', 'Gato', 'Siamés', '2021-08-20'),
  ('77777777-7777-7777-7777-777777777773', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666662', 'Rocky', 'Perro', 'Bulldog', '2020-01-15'),
  ('77777777-7777-7777-7777-777777777774', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666663', 'Bella', 'Perro', 'Poodle', '2022-11-05'),
  ('77777777-7777-7777-7777-777777777775', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666663', 'Milo', 'Gato', 'Mestizo', '2023-03-30')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.tipo_citas
INSERT INTO public.tipo_citas (id, clinica_id, nombre, duracion_min, color)
VALUES 
  ('88888888-8888-8888-8888-888888888881', '22222222-2222-2222-2222-222222222222', 'Consulta', 30, '#4f46e5'),
  ('88888888-8888-8888-8888-888888888882', '22222222-2222-2222-2222-222222222222', 'Vacunación', 15, '#10b981'),
  ('88888888-8888-8888-8888-888888888883', '22222222-2222-2222-2222-222222222222', 'Cirugía', 120, '#ef4444')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.citas (5 citas: ayer, hoy y mañana)
INSERT INTO public.citas (id, clinica_id, cliente_id, mascota_id, tipo_cita_id, estado, start_date, end_date)
VALUES 
  ('99999999-9999-9999-9999-999999999991', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888882', 'completada', now() - interval '1 day' + interval '10 hours', now() - interval '1 day' + interval '10 hours 15 minutes'),
  ('99999999-9999-9999-9999-999999999992', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', '77777777-7777-7777-7777-777777777772', '88888888-8888-8888-8888-888888888881', 'programada', now() + interval '1 day' + interval '11 hours', now() + interval '1 day' + interval '11 hours 30 minutes'),
  ('99999999-9999-9999-9999-999999999993', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666662', '77777777-7777-7777-7777-777777777773', '88888888-8888-8888-8888-888888888883', 'programada', now() + interval '2 days' + interval '9 hours', now() + interval '2 days' + interval '11 hours'),
  ('99999999-9999-9999-9999-999999999994', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666663', '77777777-7777-7777-7777-777777777774', '88888888-8888-8888-8888-888888888882', 'completada', now() - interval '2 hours', now() - interval '1 hour 45 minutes'),
  ('99999999-9999-9999-9999-999999999995', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666663', '77777777-7777-7777-7777-777777777775', '88888888-8888-8888-8888-888888888881', 'en_curso', now() - interval '15 minutes', now() + interval '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.ordenes_servicio (3 órdenes: open, in_progress, finished)
INSERT INTO public.ordenes_servicio (id, clinica_id, estado_text, cliente_id, mascota_id, staff_user_id, started_at, finished_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 'open', '66666666-6666-6666-6666-666666666661', '77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'in_progress', '66666666-6666-6666-6666-666666666663', '77777777-7777-7777-7777-777777777775', '11111111-1111-1111-1111-111111111111', now() - interval '20 minutes', null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '22222222-2222-2222-2222-222222222222', 'finished', '66666666-6666-6666-6666-666666666663', '77777777-7777-7777-7777-777777777774', '11111111-1111-1111-1111-111111111111', now() - interval '2 hours', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.ventas
INSERT INTO public.ventas (id, clinica_id, cliente_id, orden_id, estado, total, created_by)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666663', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'pagada', 43.00, '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', null, 'abierta', 53.00, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.items_venta
INSERT INTO public.items_venta (id, clinica_id, venta_id, item_id, cantidad, precio_unitario, total_linea)
VALUES 
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '55555555-5555-5555-5555-555555555552', 1, 25.00, 25.00), -- Vacuna
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '55555555-5555-5555-5555-555555555557', 1, 18.00, 18.00), -- Pipeta
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '55555555-5555-5555-5555-555555555558', 1, 35.00, 35.00), -- Alimento
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '55555555-5555-5555-5555-555555555557', 1, 18.00, 18.00)  -- Pipeta
ON CONFLICT (id) DO NOTHING;

-- Insert into public.ledger (Pagos)
INSERT INTO public.ledger (id, clinica_id, cliente_id, venta_id, orden_id, tipo, monto)
VALUES 
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666663', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'pago', 43.00),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', null, 'abono', 20.00)
ON CONFLICT (id) DO NOTHING;

-- Insert some initial stock (Entradas y Salidas)
INSERT INTO public.movimientos_stock (clinica_id, item_id, almacen_id, qty, tipo, notas, created_by)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333333', 100, 'compra', 'Inventario inicial - Vacuna', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333333', 200, 'compra', 'Inventario inicial - Desparasitante', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555557', '33333333-3333-3333-3333-333333333333', 50, 'compra', 'Inventario inicial - Pipeta', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555558', '33333333-3333-3333-3333-333333333333', 20, 'compra', 'Inventario inicial - Alimento', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555559', '33333333-3333-3333-3333-333333333333', 15, 'compra', 'Inventario inicial - Collar', '11111111-1111-1111-1111-111111111111'),
  -- Salidas por las ventas
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333333', -1, 'venta', 'Venta #bbbbbbbb...1', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555557', '33333333-3333-3333-3333-333333333333', -2, 'venta', 'Venta #bbbbbbbb...1 y #2', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555558', '33333333-3333-3333-3333-333333333333', -1, 'venta', 'Venta #bbbbbbbb...2', '11111111-1111-1111-1111-111111111111');
