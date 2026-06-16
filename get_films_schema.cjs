const { createClient } = require('@supabase/supabase-js');
const VITE_SUPABASE_URL='https://tqcwktdujwcambixbdcs.supabase.co';
const VITE_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3drdGR1andjYW1iaXhiZGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjc1NzksImV4cCI6MjA5Mjk0MzU3OX0.fdMDjPNH0HwRyCFgFrKHTxoC9qvWXjRREXvXQyK1OyE';
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('films').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No data, try getting policy error or just query another way.");
    }
  }
}
run();
