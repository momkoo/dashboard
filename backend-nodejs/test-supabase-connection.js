// Script to test Supabase connection using environment variables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '[set]' : '[missing]');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Supabase env variables are missing.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function testConnection() {
  try {
    // Try to select 1 row from web_sources
    const { data, error } = await supabase.from('web_sources').select('*').limit(1);
    if (error) {
      console.error('Supabase query error:', error);
      process.exit(2);
    }
    console.log('Supabase connection OK. Sample data:', data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(3);
  }
}

testConnection();
