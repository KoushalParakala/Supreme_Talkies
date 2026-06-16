const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL='https://tqcwktdujwcambixbdcs.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3drdGR1andjYW1iaXhiZGNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM2NzU3OSwiZXhwIjoyMDkyOTQzNTc5fQ.up4Xr_a3JQo8XlQ1BxjGVoqoVQvslYyIevIhynjlZOA';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Insert dummy row
  const { data, error } = await supabase.from('films').insert([{ title: 'test_dummy_film' }]).select();
  if (error) {
    console.log("Insert Error:", error);
  } else {
    console.log("Columns:", Object.keys(data[0]));
    // Cleanup
    await supabase.from('films').delete().eq('id', data[0].id);
  }
}
run();
