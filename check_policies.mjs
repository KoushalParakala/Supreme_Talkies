import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:\\Codes\\Supreme talkies main\\.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let url = '', serviceKey = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
}

const adminDb = createClient(url, serviceKey);

async function checkPolicies() {
  const { data, error } = await adminDb.rpc('get_policies_for_table', { table_name: 'submissions' });
  if (error) {
    console.log("RPC get_policies_for_table failed, let's just query pg_policies via REST if possible, but we can't.");
  } else {
    console.log(data);
  }
}

checkPolicies().catch(console.error);
