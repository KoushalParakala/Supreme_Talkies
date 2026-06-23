import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:\\Codes\\Supreme talkies main\\.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let url = '', key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function test() {
  // Let's see if we can log in. If we can't, anon access is blocked.
  // The policy allows 'authenticated' users.
  
  let serviceKey = '';
  for (const line of envContent.split('\n')) {
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
  }
  const adminDb = createClient(url, serviceKey);

  const { data: allIdeas, error } = await adminDb
    .from('submissions')
    .select('*, profiles(full_name, role, roles)')
    .eq('type', 'marketing_idea');
    
  console.log('Marketing ideas count (admin):', allIdeas?.length);
  if (error) console.log('Admin fetch error:', error);
}

test().catch(console.error);
