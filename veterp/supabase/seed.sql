-- Insert into auth.users (Usamos un hash de bcrypt generado correctamente para "password123")
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111', 
  'authenticated', 
  'authenticated', 
  'admin@veterp.com', 
  '$2b$10$.9t7UyFui2MCzHV6tW0iZed3rRYM.NMhmSAkSJhRQ5sNlU23ar4PW', 
  now(), 
  '{"provider":"email","providers":["email"]}', 
  '{}', 
  now(), 
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert into auth.identities (OBLIGATORIO en las nuevas versiones de Supabase para poder hacer login)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'admin@veterp.com')::jsonb,
  'email',
  '11111111-1111-1111-1111-111111111111',
  now(),
  now(),
  now()
)
ON CONFLICT (provider, provider_id) DO NOTHING;

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
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Proveedor Demo', 'Juan Perez', '555-1234')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.items_catalogo
INSERT INTO public.items_catalogo (id, clinica_id, nombre, descripcion, kind, precio_inc, proveedor_id)
VALUES 
  ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222', 'Consulta General', 'Consulta general de rutina', 'servicio', 50.00, null),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222', 'Vacuna Antirrábica', 'Vacuna anual', 'producto', 25.00, '44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222', 'Desparasitante Interno', 'Pastilla desparasitante', 'producto', 15.00, '44444444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- Insert some initial stock
INSERT INTO public.movimientos_stock (clinica_id, item_id, almacen_id, qty, tipo, notas)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333333', 100, 'entrada', 'Inventario inicial'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333333', 200, 'entrada', 'Inventario inicial');