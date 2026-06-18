import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:\\Codes\\Supreme talkies main\\.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let url = '', key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function checkSchema() {
  const { data: prof, error: e1 } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles data with Service Role:', prof ? Object.keys(prof[0] || {}) : prof, 'error:', e1);
}

checkSchema().catch(console.error);
