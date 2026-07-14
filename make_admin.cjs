const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL='https://tqcwktdujwcambixbdcs.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3drdGR1andjYW1iaXhiZGNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM2NzU3OSwiZXhwIjoyMDkyOTQzNTc5fQ.up4Xr_a3JQo8XlQ1BxjGVoqoVQvslYyIevIhynjlZOA';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = process.argv[2] || 'koushal.sub@gmail.com';
  console.log(`Setting role to admin for ${email}...`);
  // Assuming profiles table has a user_id or id that matches auth.users.id
  // First get the user id
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error("Auth Error:", userError);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error(`User with email ${email} not found in auth.users.`);
    return;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id)
    .select();
    
  if (error) {
    console.error("Profile update error:", error);
  } else {
    console.log("Profile updated successfully:", data);
  }
}
run();
