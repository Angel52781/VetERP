const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'usuario_prueba_2@veterp.com',
    password: 'password123',
  });

  if (data && data.user) {
    console.log(JSON.stringify(data.user.identities[0], null, 2));
  }
}

testSignup();