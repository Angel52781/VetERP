const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Verificando conexión a Supabase...');
  console.log('URL:', supabaseUrl);
  
  console.log('\nIntentando login con admin@veterp.com / password123 ...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@veterp.com',
    password: 'password123',
  });

  if (error) {
    console.error('❌ Error de login:', error.message);
    console.error('Detalles del error:', error);
  } else {
    console.log('✅ Login exitoso! El usuario existe y la contraseña es correcta.');
    console.log('Usuario ID:', data.user.id);
  }
}

check();
