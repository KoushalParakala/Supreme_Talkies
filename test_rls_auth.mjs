import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:\\Codes\\Supreme talkies main\\.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let url = '', anonKey = '', serviceKey = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) anonKey = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
}

const adminDb = createClient(url, serviceKey);
const anonDb = createClient(url, anonKey);

async function testRLS() {
  const email = `test_rls_${Date.now()}@example.com`;
  const password = 'password123';
  
  const { data: user, error: userErr } = await adminDb.auth.admin.createUser({ email, password, email_confirm: true });
  
  await anonDb.auth.signInWithPassword({ email, password });
  
  console.log("Testing profiles fetch...");
  const { data: profs, error: profErr } = await anonDb.from('profiles').select('*');
  console.log('Profiles error:', profErr);
  
  await adminDb.auth.admin.deleteUser(user.user.id);
}

testRLS().catch(console.error);
