const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log('Intentando registro de usuario_prueba_1@veterp.com...');
  const { data, error } = await supabase.auth.signUp({
    email: 'usuario_prueba_1@veterp.com',
    password: 'password123',
  });

  if (error) {
    console.error('❌ Error de signUp:', error.message);
  } else {
    console.log('✅ Signup exitoso!', data);
    if (data.session) {
      console.log('Sesión activa obtenida (login automático)');
    } else {
      console.log('NO se obtuvo sesión (probablemente confirmación de email siga activa)');
    }
  }
}

testSignup();