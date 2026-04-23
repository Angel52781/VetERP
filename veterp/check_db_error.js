const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseError() {
  console.log('--- TEST 1: Consulta básica a tabla pública ---');
  const { data: clinicas, error: clinicasError } = await supabase.from('clinicas').select('*').limit(1);
  if (clinicasError) console.error('Error clinicas:', clinicasError);
  else console.log('Clínicas OK:', clinicas);

  console.log('\n--- TEST 2: Intento de login ---');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin@veterp.com',
    password: 'password123',
  });
  
  if (loginError) {
    console.error('Error Login (Status):', loginError.status);
    console.error('Error Login (Message):', loginError.message);
    console.error('Error Login (Name):', loginError.name);
  } else {
    console.log('Login OK');
  }
}

checkDatabaseError();