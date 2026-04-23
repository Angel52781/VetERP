const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminLogin() {
  console.log('Intentando login con admin@veterp.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@veterp.com',
    password: 'password123',
  });

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Login de admin EXITOSO!');
    console.log('User ID:', data.user.id);
  }
}

checkAdminLogin();